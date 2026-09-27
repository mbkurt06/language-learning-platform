from __future__ import annotations

from typing import Annotated
from uuid import UUID
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session
from .config import get_settings
from .db import SessionLocal
from .models import (
    ContentSource,
    Encounter,
    ExampleLexemeMatch,
    ExampleSentence,
    ExampleSource,
    LearningItem,
    LearningItemTranslation,
    LearningProfile,
    User,
)
from .providers import provider_catalog
from .schemas import (
    AnalyzeAndMatchRequest,
    AnalyzeAndMatchResponse,
    AnalyzeRequest,
    AnalyzeResponse,
    EncounterCreate,
    ExampleCorpusIndexRequest,
    LearningItemCreate,
    LearningProfileCreate,
    LearningProfileEnsure,
    UserCreate,
)
from .services import UnsupportedLanguageError, analyze_text, match_learning_items


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


DbSession = Annotated[Session, Depends(get_db)]


app = FastAPI(title="Language Learning Platform API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().allowed_origins(),
    allow_origin_regex=get_settings().cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "environment": get_settings().environment}


@app.get("/api/v1/providers")
def providers():
    return {"providers": provider_catalog()}


EXAMPLE_INDEX_TARGETS = {
    # Visual, natural-speed German videos selected for the initial lernen corpus.
    # The browser extension captures the real YouTube JSON3 cues and the API
    # verifies the lemma before storing an example, so no guessed timestamps
    # are committed here.
    "KJ7qOMr_6o0": ["lernen"],  # GERMANIA - MefYou
    "kup1mfXtkTc": ["lernen"],  # GERMANIA - Melissa Lee
    "P0XJHzynUYE": ["lernen"],  # GERMANIA - Sugar MMFK
    "68-ITNXS78E": ["lernen"],  # GERMANIA - Donnie O'Sullivan
    "_yFGmiHn_UE": ["lernen"],  # GERMANIA - Der Asiate
    "TpqxiHgyy_Y": ["lernen"],  # Joseph DeChangeman - Selbstexperiment
}


@app.get("/api/v1/example-corpus/index-targets")
def example_index_targets():
    return {"targets": EXAMPLE_INDEX_TARGETS}


@app.post("/api/v1/example-corpus/index-cues")
def index_example_cues(payload: ExampleCorpusIndexRequest, db: DbSession):
    target_lemmas = {lemma.lower() for lemma in payload.target_lemmas}
    expected = set(EXAMPLE_INDEX_TARGETS.get(payload.external_id, []))
    if expected and not target_lemmas.issubset(expected):
        raise HTTPException(status_code=422, detail="unexpected target lemma for video")

    source = db.scalar(select(ExampleSource).where(
        ExampleSource.provider == payload.provider,
        ExampleSource.external_id == payload.external_id,
    ))
    if source is None:
        source = ExampleSource(
            provider=payload.provider,
            external_id=payload.external_id,
            title=payload.title,
            url=payload.url,
            language=payload.language,
            metadata_json={"indexed_by": "browser-extension"},
        )
        db.add(source)
        db.flush()
    else:
        source.title = payload.title or source.title
        source.url = payload.url or source.url

    indexed = []
    for lemma in sorted(target_lemmas):
        # Cheap pre-filter: German inflections normally preserve a useful
        # lexical prefix. This keeps us from calling the language engine on
        # every subtitle cue in a long video.
        prefix = lemma[:4]
        candidate_cues = [cue for cue in payload.cues if prefix in cue.text.lower()]
        for cue in candidate_cues:
            try:
                analysis = analyze_text(payload.language, cue.text)
            except Exception:
                continue

            token = next(
                (
                    token for token in analysis.get("tokens", [])
                    if str(token.get("lemma", "")).lower() == lemma
                ),
                None,
            )
            if token is None:
                continue

            sentence = db.scalar(select(ExampleSentence).where(
                ExampleSentence.source_id == source.id,
                ExampleSentence.start_ms == cue.start_ms,
                ExampleSentence.end_ms == cue.end_ms,
            ))
            if sentence is None:
                sentence = ExampleSentence(
                    source_id=source.id,
                    sentence=cue.text,
                    start_ms=cue.start_ms,
                    end_ms=cue.end_ms,
                    quality="youtube-json3",
                    metadata_json={"indexed_by": "browser-extension"},
                )
                db.add(sentence)
                db.flush()

            match = db.scalar(select(ExampleLexemeMatch).where(
                ExampleLexemeMatch.example_sentence_id == sentence.id,
                ExampleLexemeMatch.lemma == lemma,
            ))
            if match is None:
                db.add(ExampleLexemeMatch(
                    example_sentence_id=sentence.id,
                    lemma=lemma,
                    surface_form=str(token.get("text") or lemma),
                ))

            indexed.append({
                "lemma": lemma,
                "sentence": cue.text,
                "start_ms": cue.start_ms,
                "end_ms": cue.end_ms,
            })
            break

    db.commit()
    return {"indexed": indexed, "count": len(indexed)}


@app.post("/api/v1/example-corpus/index-video")
def index_example_video(payload: ExampleCorpusIndexRequest, db: DbSession):
    allowed_pos = {"NOUN", "PROPN", "VERB", "ADJ", "ADV"}

    source = db.scalar(select(ExampleSource).where(
        ExampleSource.provider == payload.provider,
        ExampleSource.external_id == payload.external_id,
    ))
    if source is None:
        source = ExampleSource(
            provider=payload.provider,
            external_id=payload.external_id,
            title=payload.title,
            url=payload.url,
            language=payload.language,
            metadata_json={"indexed_by": "browser-extension-manual"},
        )
        db.add(source)
        db.flush()
    else:
        source.title = payload.title or source.title
        source.url = payload.url or source.url

    indexed = []
    seen_lemmas = set()

    for cue in payload.cues:
        try:
            analysis = analyze_text(payload.language, cue.text)
        except Exception:
            continue

        candidates = [
            token for token in analysis.get("tokens", [])
            if str(token.get("pos", "")).upper() in allowed_pos
            and str(token.get("lemma", "")).strip()
        ]
        if not candidates:
            continue

        sentence = db.scalar(select(ExampleSentence).where(
            ExampleSentence.source_id == source.id,
            ExampleSentence.start_ms == cue.start_ms,
            ExampleSentence.end_ms == cue.end_ms,
        ))
        if sentence is None:
            sentence = ExampleSentence(
                source_id=source.id,
                sentence=cue.text,
                start_ms=cue.start_ms,
                end_ms=cue.end_ms,
                quality="youtube-json3",
                metadata_json={"indexed_by": "browser-extension-manual"},
            )
            db.add(sentence)
            db.flush()

        for token in candidates:
            lemma = str(token.get("lemma", "")).strip().lower()
            if not lemma or lemma in seen_lemmas:
                continue

            match = db.scalar(select(ExampleLexemeMatch).where(
                ExampleLexemeMatch.example_sentence_id == sentence.id,
                ExampleLexemeMatch.lemma == lemma,
            ))
            if match is None:
                db.add(ExampleLexemeMatch(
                    example_sentence_id=sentence.id,
                    lemma=lemma,
                    surface_form=str(token.get("text") or lemma),
                ))

            seen_lemmas.add(lemma)
            indexed.append({
                "lemma": lemma,
                "surface_form": str(token.get("text") or lemma),
                "sentence": cue.text,
                "start_ms": cue.start_ms,
                "end_ms": cue.end_ms,
            })

    db.commit()
    return {
        "indexed": indexed,
        "count": len(indexed),
        "unique_lemmas": len(seen_lemmas),
    }


@app.post("/api/v1/users")
def create_user(payload: UserCreate, db: DbSession):
    user = User(external_subject=payload.external_subject)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "external_subject": user.external_subject}


@app.post("/api/v1/profiles")
def create_profile(payload: LearningProfileCreate, db: DbSession):
    profile = LearningProfile(
        user_id=payload.user_id,
        source_language=payload.source_language,
        target_language=payload.target_language,
        level=payload.level,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return {
        "id": profile.id,
        "source_language": profile.source_language,
        "target_language": profile.target_language,
        "level": profile.level,
    }


@app.get("/api/v1/profiles")
def list_profiles(db: DbSession):
    profiles = db.scalars(select(LearningProfile).order_by(LearningProfile.created_at.desc())).all()
    return {"profiles": [{
        "id": profile.id,
        "source_language": profile.source_language,
        "target_language": profile.target_language,
        "level": profile.level,
        "created_at": profile.created_at,
    } for profile in profiles]}


@app.post("/api/v1/profiles/ensure")
def ensure_profile(payload: LearningProfileEnsure, db: DbSession):
    user = db.scalar(select(User).where(User.external_subject == payload.external_subject))
    if user is None:
        user = User(external_subject=payload.external_subject)
        db.add(user)
        db.flush()

    profile = db.scalar(select(LearningProfile).where(
        LearningProfile.user_id == user.id,
        LearningProfile.source_language == payload.source_language,
        LearningProfile.target_language == payload.target_language,
    ))
    if profile is None:
        profile = LearningProfile(
            user_id=user.id,
            source_language=payload.source_language,
            target_language=payload.target_language,
            level=payload.level,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return {
        "id": profile.id,
        "source_language": profile.source_language,
        "target_language": profile.target_language,
        "level": profile.level,
    }


@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest):
    try:
        analysis = analyze_text(payload.source_language, payload.text)
    except UnsupportedLanguageError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"language engine failed: {exc}") from exc
    return {"analysis": analysis}


@app.post("/api/v1/analyze-and-match", response_model=AnalyzeAndMatchResponse)
def analyze_and_match(payload: AnalyzeAndMatchRequest, db: DbSession):
    try:
        analysis = analyze_text(payload.source_language, payload.text)
    except UnsupportedLanguageError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"language engine failed: {exc}") from exc
    return {"analysis": analysis, "learning_matches": match_learning_items(db, payload.profile_id, analysis)}


def serialize_examples(db: Session, lemma: str, limit: int = 6):
    matches = db.scalars(
        select(ExampleLexemeMatch)
        .where(ExampleLexemeMatch.lemma == lemma.lower())
    ).all()

    examples = []
    seen_sources = set()
    for match in matches:
        sentence = db.get(ExampleSentence, match.example_sentence_id)
        if sentence is None or sentence.source_id in seen_sources:
            continue
        source = db.get(ExampleSource, sentence.source_id)
        if source is None:
            continue
        seen_sources.add(sentence.source_id)
        examples.append({
            "id": sentence.id,
            "surface_form": match.surface_form,
            "sentence": sentence.sentence,
            "media_timestamp_ms": sentence.start_ms,
            "media_end_timestamp_ms": sentence.end_ms,
            "quality": sentence.quality,
            "source": {
                "provider": source.provider,
                "source_type": "video",
                "external_id": source.external_id,
                "url": source.url,
                "title": source.title,
            },
        })
        if len(examples) >= limit:
            break
    return examples


def serialize_learning_item(db: Session, item: LearningItem):
    encounters = db.scalars(
        select(Encounter)
        .where(Encounter.learning_item_id == item.id)
        .order_by(Encounter.encountered_at.desc())
    ).all()
    return {
        "id": item.id,
        "canonical_form": item.canonical_form,
        "canonical_key": item.canonical_key,
        "category": item.category,
        "language_specific_type": item.language_specific_type,
        "status": item.status,
        "translations": [{"language": t.language, "meaning": t.meaning} for t in item.translations],
        "examples": serialize_examples(db, item.canonical_key) if item.category == "word" else [],
        "encounters": [{
            "id": encounter.id,
            "surface_form": encounter.surface_form,
            "sentence": encounter.sentence,
            "media_timestamp_ms": encounter.media_timestamp_ms,
            "media_end_timestamp_ms": encounter.media_end_timestamp_ms,
            "encountered_at": encounter.encountered_at,
            "context": encounter.context_json,
            "source": (
                {
                    "provider": source.provider,
                    "source_type": source.source_type,
                    "external_id": source.external_id,
                    "url": source.url,
                    "title": source.title,
                }
                if (source := db.get(ContentSource, encounter.source_id))
                else None
            ),
        } for encounter in encounters],
    }


@app.get("/api/v1/learning-items")
def list_learning_items(profile_id: UUID, db: DbSession):
    if db.get(LearningProfile, profile_id) is None:
        raise HTTPException(status_code=404, detail="learning profile not found")
    items = db.scalars(
        select(LearningItem)
        .where(LearningItem.profile_id == profile_id)
        .order_by(LearningItem.created_at.desc())
    ).all()
    return {"items": [serialize_learning_item(db, item) for item in items]}


@app.post("/api/v1/learning-items")
def create_learning_item(payload: LearningItemCreate, db: DbSession):
    if db.get(LearningProfile, payload.profile_id) is None:
        raise HTTPException(status_code=404, detail="learning profile not found")

    item = db.scalar(select(LearningItem).where(
        LearningItem.profile_id == payload.profile_id,
        LearningItem.canonical_key == payload.canonical_key,
    ))
    if item is None:
        item = LearningItem(
            profile_id=payload.profile_id,
            canonical_form=payload.canonical_form,
            canonical_key=payload.canonical_key,
            category=payload.category,
            language_specific_type=payload.language_specific_type,
            status=payload.status,
            metadata_json=payload.metadata,
        )
        db.add(item)
        db.flush()
    else:
        item.canonical_form = payload.canonical_form
        item.category = payload.category
        item.language_specific_type = payload.language_specific_type
        item.status = payload.status
        item.metadata_json = payload.metadata

    if payload.meaning and payload.meaning_language:
        translation = db.scalar(select(LearningItemTranslation).where(
            LearningItemTranslation.learning_item_id == item.id,
            LearningItemTranslation.language == payload.meaning_language,
        ))
        if translation is None:
            db.add(LearningItemTranslation(
                learning_item_id=item.id,
                language=payload.meaning_language,
                meaning=payload.meaning,
            ))
        else:
            translation.meaning = payload.meaning

    db.commit()
    db.refresh(item)
    return serialize_learning_item(db, item)


@app.delete("/api/v1/learning-items/{item_id}")
def delete_learning_item(item_id: UUID, db: DbSession):
    item = db.get(LearningItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="learning item not found")
    db.delete(item)
    db.commit()
    return {"deleted": True, "id": item_id}


@app.post("/api/v1/encounters")
def create_encounter(payload: EncounterCreate, db: DbSession):
    item = db.get(LearningItem, payload.learning_item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="learning item not found")

    source = db.scalar(select(ContentSource).where(
        ContentSource.provider == payload.provider,
        ContentSource.external_id == payload.external_id,
    ))
    if source is None:
        source = ContentSource(
            provider=payload.provider,
            source_type=payload.source_type,
            external_id=payload.external_id,
            url=payload.url,
            title=payload.title,
        )
        db.add(source)
        db.flush()
    else:
        source.url = payload.url or source.url
        source.title = payload.title or source.title
        source.source_type = payload.source_type

    encounter = db.scalar(select(Encounter).where(
        Encounter.learning_item_id == payload.learning_item_id,
        Encounter.source_id == source.id,
        Encounter.sentence == payload.sentence,
        Encounter.media_timestamp_ms == payload.media_timestamp_ms,
    ))
    if encounter is None:
        encounter = Encounter(
            learning_item_id=payload.learning_item_id,
            source_id=source.id,
            surface_form=payload.surface_form,
            sentence=payload.sentence,
            media_timestamp_ms=payload.media_timestamp_ms,
            media_end_timestamp_ms=payload.media_end_timestamp_ms,
            context_json=payload.context,
        )
        db.add(encounter)
    else:
        encounter.surface_form = payload.surface_form
        encounter.media_end_timestamp_ms = payload.media_end_timestamp_ms
        encounter.context_json = payload.context

    db.commit()
    db.refresh(encounter)
    return {"id": encounter.id}
