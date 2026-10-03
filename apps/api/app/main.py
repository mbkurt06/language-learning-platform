from __future__ import annotations

from typing import Annotated
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
import hashlib
import re
from uuid import UUID
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from .config import get_settings
from .db import SessionLocal
from .google_quota import fetch_gemini_quota
from .models import (
    AiUsageEvent,
    ContentSource,
    Encounter,
    ExampleLexemeMatch,
    ExampleSentence,
    ExampleSource,
    IndexedContent,
    IndexedSegment,
    IndexedUnit,
    LocalSentenceAnalysis,
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
    ContentIndexRequest,
    ContentIndexResponse,
    TokenBatchRequest,
    EncounterCreate,
    ExampleCorpusIndexRequest,
    LearningItemCreate,
    LearningProfileCreate,
    LearningProfileEnsure,
    LocalAnalysisBatchUpsertRequest,
    LocalAnalysisLookupRequest,
    UserCreate,
)
from .services import (
    UnsupportedLanguageError,
    analyze_content_batch,
    analyze_expression_groups_batch,
    analyze_learning_units_batch,
    analyze_text,
    analyze_tokens_batch,
    content_fingerprint,
    match_learning_items,
)


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
    "TpqxiHgyy_Y": ["lernen"],  # Joseph DeChangeman - Selbstexperiment
}


@app.get("/api/v1/example-corpus/index-targets")
def example_index_targets():
    return {"targets": EXAMPLE_INDEX_TARGETS}


def contextual_example_window(cues, target_index: int, min_ms: int = 5000, max_ms: int = 10000):
    left = target_index
    right = target_index

    while True:
        start_ms = cues[left].start_ms
        end_ms = cues[right].end_ms
        if end_ms - start_ms >= min_ms:
            break

        options = []
        if left > 0:
            span = cues[right].end_ms - cues[left - 1].start_ms
            if span <= max_ms:
                options.append((span, left - 1, right))
        if right + 1 < len(cues):
            span = cues[right + 1].end_ms - cues[left].start_ms
            if span <= max_ms:
                options.append((span, left, right + 1))

        if not options:
            break

        _, left, right = min(options, key=lambda item: item[0])

    selected = cues[left:right + 1]
    text = " ".join(cue.text.strip() for cue in selected if cue.text.strip())
    return {
        "text": " ".join(text.split()),
        "start_ms": selected[0].start_ms,
        "end_ms": selected[-1].end_ms,
    }


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
        candidate_indexes = [
            index for index, cue in enumerate(payload.cues)
            if prefix in cue.text.lower()
        ]
        for cue_index in candidate_indexes:
            cue = payload.cues[cue_index]
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

            window = contextual_example_window(payload.cues, cue_index)

            existing_sentences = db.scalars(
                select(ExampleSentence).where(ExampleSentence.source_id == source.id)
            ).all()
            for existing_sentence in existing_sentences:
                existing_matches = db.scalars(
                    select(ExampleLexemeMatch).where(
                        ExampleLexemeMatch.example_sentence_id == existing_sentence.id,
                        ExampleLexemeMatch.lemma == lemma,
                    )
                ).all()
                for existing_match in existing_matches:
                    db.delete(existing_match)

            sentence = db.scalar(select(ExampleSentence).where(
                ExampleSentence.source_id == source.id,
                ExampleSentence.start_ms == window["start_ms"],
                ExampleSentence.end_ms == window["end_ms"],
            ))
            if sentence is None:
                sentence = ExampleSentence(
                    source_id=source.id,
                    sentence=window["text"],
                    start_ms=window["start_ms"],
                    end_ms=window["end_ms"],
                    quality="youtube-json3-context",
                    metadata_json={"indexed_by": "browser-extension", "target_cue_index": cue_index},
                )
                db.add(sentence)
                db.flush()
            else:
                sentence.sentence = window["text"]
                sentence.quality = "youtube-json3-context"
                sentence.metadata_json = {
                    "indexed_by": "browser-extension",
                    "target_cue_index": cue_index,
                }

            db.add(ExampleLexemeMatch(
                example_sentence_id=sentence.id,
                lemma=lemma,
                surface_form=str(token.get("text") or lemma),
            ))

            indexed.append({
                "lemma": lemma,
                "sentence": window["text"],
                "start_ms": window["start_ms"],
                "end_ms": window["end_ms"],
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


def _normalized_segment_text(text: str) -> str:
    return " ".join(str(text or "").split())


_STAND_LINE_RE = re.compile(
    r"^Stand:\s*(\d{1,2}\.\d{1,2}\.\d{4})\s*[•·]\s*(\d{1,2}:\d{2})\s*Uhr$",
    re.IGNORECASE,
)


def _local_metadata_analysis(segment: dict, target_language: str) -> dict | None:
    """Handle mechanical article metadata without spending an AI request."""
    if target_language != "tr":
        return None
    text = _normalized_segment_text(segment.get("text", ""))
    match = _STAND_LINE_RE.match(text)
    if not match:
        return None
    date_text, time_text = match.groups()
    return {
        "index": int(segment["index"]),
        "sentence_translation": f"Güncelleme: {date_text} • {time_text}",
        "tokens": [
            {
                "i": 0,
                "pos": "NOUN",
                "lemma": "Stand",
                "surface": "Stand",
                "morphology": {},
                "contextual_meaning_tr": "güncelleme / durum itibarıyla",
            },
            {
                "i": 1,
                "pos": "NUM",
                "lemma": date_text,
                "surface": date_text,
                "morphology": {},
                "contextual_meaning_tr": date_text,
            },
            {
                "i": 2,
                "pos": "NUM",
                "lemma": time_text,
                "surface": time_text,
                "morphology": {},
                "contextual_meaning_tr": time_text,
            },
            {
                "i": 3,
                "pos": "NOUN",
                "lemma": "Uhr",
                "surface": "Uhr",
                "morphology": {},
                "contextual_meaning_tr": "saat",
            },
        ],
        "expressions": [],
        "analysis_source": "local",
    }


def serialize_indexed_content(content: IndexedContent):
    return {
        "cached": True,
        "content_id": content.id,
        "content_hash": content.content_hash,
        "analyzer_provider": content.analyzer_provider,
        "analyzer_model": content.analyzer_model,
        "analysis_schema_version": content.analysis_schema_version,
        "segments": [
            {
                "index": segment.sequence_index,
                "start_ms": segment.start_ms,
                "end_ms": segment.end_ms,
                "text": segment.source_text,
                "sentence_translation": segment.translation_text,
                "tokens": segment.analysis_json.get("tokens", []),
                "expressions": segment.analysis_json.get("expressions", []),
                "analysis_source": segment.analysis_json.get("analysis_source", "ai"),
            }
            for segment in content.segments
        ],
    }


def _historical_ai_segments_by_text(
    db: Session,
    payload: ContentIndexRequest,
    schema_version: str,
) -> tuple[dict[str, list[dict]], IndexedContent | None]:
    """Collect reusable AI segments from both complete and partial prior runs.

    A failed progressive content run can still contain many successfully
    committed AI segments. Those segments are valid sentence-level cache and
    must survive/reuse across retries and small page DOM changes.
    """
    contents = list(db.scalars(
        select(IndexedContent)
        .where(
            IndexedContent.provider == payload.provider,
            IndexedContent.external_id == payload.external_id,
            IndexedContent.source_language == payload.source_language,
            IndexedContent.target_language == payload.target_language,
            IndexedContent.analysis_schema_version == schema_version,
            IndexedContent.status.in_(["ready", "failed"]),
        )
        .order_by(IndexedContent.analyzed_at.desc(), IndexedContent.created_at.desc())
    ))

    by_text: dict[str, list[dict]] = {}
    latest = contents[0] if contents else None
    for indexed_content in contents:
        for segment in indexed_content.segments:
            source = str((segment.analysis_json or {}).get("analysis_source", "ai"))
            if source != "ai":
                continue
            key = _normalized_segment_text(segment.source_text)
            by_text.setdefault(key, []).append({
                "segment_id": str(segment.id),
                "translation_text": segment.translation_text,
                "tokens": (segment.analysis_json or {}).get("tokens", []),
                "expressions": (segment.analysis_json or {}).get("expressions", []),
                "analysis_source": "ai",
            })
    return by_text, latest


@app.post("/api/v1/content-index/lookup")
def lookup_content_index(payload: ContentIndexRequest, db: DbSession):
    """Cache-only lookup. Never calls the external AI analyzer."""
    settings = get_settings()
    segment_payloads = [segment.model_dump() for segment in payload.segments]
    fingerprint = content_fingerprint(segment_payloads)

    exact = db.scalar(
        select(IndexedContent).where(
            IndexedContent.provider == payload.provider,
            IndexedContent.external_id == payload.external_id,
            IndexedContent.source_language == payload.source_language,
            IndexedContent.target_language == payload.target_language,
            IndexedContent.content_hash == fingerprint,
            IndexedContent.analysis_schema_version == settings.ai_analysis_schema_version,
            IndexedContent.status == "ready",
        )
    )
    if exact is not None:
        result = serialize_indexed_content(exact)
        result.update({
            "coverage": "full",
            "matched_segments": len(segment_payloads),
            "total_segments": len(segment_payloads),
            "missing_indexes": [],
        })
        return result

    previous_by_text, previous = _historical_ai_segments_by_text(
        db, payload, settings.ai_analysis_schema_version
    )
    analyzer_provider = previous.analyzer_provider if previous is not None else None
    analyzer_model = previous.analyzer_model if previous is not None else None
    content_id = previous.id if previous is not None else None

    reused_segment_ids = set()
    matched = []
    missing_indexes = []
    for source in segment_payloads:
        local_analysis = _local_metadata_analysis(source, payload.target_language)
        if local_analysis is not None:
            matched.append({
                "index": source["index"],
                "start_ms": source.get("start_ms"),
                "end_ms": source.get("end_ms"),
                "text": source["text"],
                "sentence_translation": local_analysis.get("sentence_translation"),
                "tokens": local_analysis.get("tokens", []),
                "expressions": local_analysis.get("expressions", []),
                "analysis_source": "local",
            })
            continue

        normalized = _normalized_segment_text(source["text"])
        candidates = previous_by_text.get(normalized, [])
        reused = next(
            (candidate for candidate in candidates if candidate["segment_id"] not in reused_segment_ids),
            None,
        )
        if reused is None:
            missing_indexes.append(source["index"])
            continue

        reused_segment_ids.add(reused["segment_id"])
        matched.append({
            "index": source["index"],
            "start_ms": source.get("start_ms"),
            "end_ms": source.get("end_ms"),
            "text": source["text"],
            "sentence_translation": reused["translation_text"],
            "tokens": reused["tokens"],
            "expressions": reused["expressions"],
            "analysis_source": "ai",
        })

    total = len(segment_payloads)
    matched_count = len(matched)
    coverage = "full" if matched_count == total and total else "partial" if matched_count else "none"
    return {
        "cached": True,
        "coverage": coverage,
        "matched_segments": matched_count,
        "total_segments": total,
        "missing_indexes": missing_indexes,
        "content_id": content_id,
        "content_hash": fingerprint,
        "analyzer_provider": analyzer_provider,
        "analyzer_model": analyzer_model,
        "analysis_schema_version": settings.ai_analysis_schema_version,
        "segments": matched,
    }


def _persist_indexed_segment(db: Session, content: IndexedContent, source: dict, item: dict):
    segment = IndexedSegment(
        content_id=content.id,
        sequence_index=source["index"],
        start_ms=source.get("start_ms"),
        end_ms=source.get("end_ms"),
        source_text=source["text"],
        translation_text=item.get("sentence_translation"),
        analysis_json={
            "tokens": item.get("tokens", []),
            "expressions": item.get("expressions", []),
            "analysis_source": item.get("analysis_source", "ai"),
        },
    )
    db.add(segment)
    db.flush()

    for token in item.get("tokens", []):
        lemma = str(token.get("lemma") or token.get("surface") or "").strip()
        if not lemma:
            continue
        db.add(IndexedUnit(
            segment_id=segment.id,
            kind="word",
            canonical_form=lemma,
            canonical_key=lemma.lower(),
            surface_form=str(token.get("surface") or lemma),
            language_specific_type=str(token.get("pos") or "") or None,
            contextual_meaning=token.get("contextual_meaning_tr"),
            token_indices_json=[token.get("i")] if token.get("i") is not None else [],
            metadata_json={"morphology": token.get("morphology") or {}},
        ))

    for expression in item.get("expressions", []):
        canonical = str(expression.get("canonical") or expression.get("surface") or "").strip()
        if not canonical:
            continue
        expression_type = str(expression.get("type") or "FIXED_CONSTRUCTION")
        db.add(IndexedUnit(
            segment_id=segment.id,
            kind="expression",
            canonical_form=canonical,
            canonical_key=f"{expression_type.lower()}:{canonical.lower()}",
            surface_form=str(expression.get("surface") or canonical),
            language_specific_type=expression_type,
            contextual_meaning=expression.get("contextual_meaning_tr"),
            token_indices_json=expression.get("token_indices") or [],
            metadata_json={
                "grammar_hint": expression.get("grammar_hint") or "",
                "highlight_parts": expression.get("highlight_parts") or [],
            },
        ))


def _text_hash(text: str) -> str:
    normalized = _normalized_segment_text(text)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


@app.post("/api/v1/local-analysis/lookup")
def lookup_local_analysis(payload: LocalAnalysisLookupRequest, db: DbSession):
    row = db.scalar(
        select(LocalSentenceAnalysis).where(
            LocalSentenceAnalysis.provider == payload.provider,
            LocalSentenceAnalysis.external_id == payload.external_id,
            LocalSentenceAnalysis.source_language == payload.source_language,
            LocalSentenceAnalysis.target_language == payload.target_language,
            LocalSentenceAnalysis.text_hash == _text_hash(payload.text),
        )
    )
    if row is None:
        return {"found": False, "analysis": None}
    analysis = dict(row.analysis_json or {})
    analysis["analysis_source"] = "local"
    analysis["local_source_kind"] = row.source_kind
    return {"found": True, "analysis": analysis, "source_kind": row.source_kind}


@app.post("/api/v1/local-analysis/lookup-batch")
def lookup_local_analysis_batch(payload: ContentIndexRequest, db: DbSession):
    matched = []
    missing_indexes = []
    for segment in payload.segments:
        row = db.scalar(
            select(LocalSentenceAnalysis).where(
                LocalSentenceAnalysis.provider == payload.provider,
                LocalSentenceAnalysis.external_id == payload.external_id,
                LocalSentenceAnalysis.source_language == payload.source_language,
                LocalSentenceAnalysis.target_language == payload.target_language,
                LocalSentenceAnalysis.text_hash == _text_hash(segment.text),
            )
        )
        if row is None:
            missing_indexes.append(segment.index)
            continue
        analysis = dict(row.analysis_json or {})
        analysis["analysis_source"] = "local"
        analysis["local_source_kind"] = row.source_kind
        matched.append({
            "index": segment.index,
            "text": segment.text,
            "analysis": analysis,
            "source_kind": row.source_kind,
        })
    total = len(payload.segments)
    count = len(matched)
    coverage = "full" if total and count == total else "partial" if count else "none"
    return {
        "coverage": coverage,
        "matched_segments": count,
        "total_segments": total,
        "missing_indexes": missing_indexes,
        "segments": matched,
    }


@app.post("/api/v1/local-analysis/upsert-batch")
def upsert_local_analysis_batch(payload: LocalAnalysisBatchUpsertRequest, db: DbSession):
    stored = 0
    for item in payload.items:
        text_hash = _text_hash(item.text)
        row = db.scalar(
            select(LocalSentenceAnalysis).where(
                LocalSentenceAnalysis.provider == payload.provider,
                LocalSentenceAnalysis.external_id == payload.external_id,
                LocalSentenceAnalysis.source_language == payload.source_language,
                LocalSentenceAnalysis.target_language == payload.target_language,
                LocalSentenceAnalysis.text_hash == text_hash,
            )
        )
        analysis = dict(item.analysis or {})
        analysis["analysis_source"] = "local"
        if row is None:
            row = LocalSentenceAnalysis(
                provider=payload.provider,
                external_id=payload.external_id,
                source_language=payload.source_language,
                target_language=payload.target_language,
                text_hash=text_hash,
                source_text=item.text,
                source_kind=item.source_kind,
                analysis_json=analysis,
            )
            db.add(row)
        else:
            row.source_text = item.text
            row.source_kind = item.source_kind
            row.analysis_json = analysis
        stored += 1
    db.commit()
    return {"stored": stored}


@app.get("/api/v1/content-index/status")
def content_index_status(
    provider: str,
    external_id: str,
    db: DbSession,
    source_language: str = "de",
    target_language: str = "tr",
):
    content = db.scalar(
        select(IndexedContent)
        .where(
            IndexedContent.provider == provider,
            IndexedContent.external_id == external_id,
            IndexedContent.source_language == source_language,
            IndexedContent.target_language == target_language,
        )
        .order_by(IndexedContent.created_at.desc())
    )
    if content is None:
        raise HTTPException(status_code=404, detail="indexed content not found")
    result = serialize_indexed_content(content)
    result["status"] = content.status
    result["progress"] = (content.metadata_json or {}).get("progress", {})
    return result


def _record_ai_usage(db: Session, result: dict, *, content_id, batch_index: int):
    usage = result.get("usage") or {}
    request_count = int(usage.get("request_count") or 0)
    total_tokens = int(usage.get("total_tokens") or 0)
    if request_count <= 0 and total_tokens <= 0:
        return
    db.add(AiUsageEvent(
        provider=str(result.get("provider") or "gemini"),
        model=str(result.get("model") or "unknown"),
        request_count=max(1, request_count),
        input_tokens=int(usage.get("input_tokens") or 0),
        output_tokens=int(usage.get("output_tokens") or 0),
        total_tokens=total_tokens,
        cached_tokens=int(usage.get("cached_tokens") or 0),
        metadata_json={"content_id": str(content_id), "batch_index": batch_index},
    ))


def _usage_window(db: Session, since: datetime) -> dict:
    row = db.execute(
        select(
            func.coalesce(func.sum(AiUsageEvent.request_count), 0),
            func.coalesce(func.sum(AiUsageEvent.input_tokens), 0),
            func.coalesce(func.sum(AiUsageEvent.output_tokens), 0),
            func.coalesce(func.sum(AiUsageEvent.total_tokens), 0),
            func.coalesce(func.sum(AiUsageEvent.cached_tokens), 0),
        ).where(AiUsageEvent.created_at >= since)
    ).one()
    return {
        "requests": int(row[0] or 0),
        "input_tokens": int(row[1] or 0),
        "output_tokens": int(row[2] or 0),
        "total_tokens": int(row[3] or 0),
        "cached_tokens": int(row[4] or 0),
    }


@app.get("/api/v1/ai-usage/summary")
def ai_usage_summary(db: DbSession):
    now = datetime.now(timezone.utc)
    pacific = ZoneInfo("America/Los_Angeles")
    now_pt = now.astimezone(pacific)
    google_day_start = now_pt.replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    latest = db.scalar(select(AiUsageEvent).order_by(AiUsageEvent.created_at.desc()).limit(1))
    settings = get_settings()
    latest_model = latest.model if latest else "gemini-2.5-flash-lite"
    try:
        official_quota = fetch_gemini_quota(
            settings.google_cloud_project,
            latest_model,
            settings.google_cloud_service_account_json,
        )
    except Exception as exc:
        official_quota = {
            "status": "error",
            "project_id": settings.google_cloud_project or None,
            "model": latest_model,
            "limits": [],
            "note": f"Google Cloud quota lookup failed: {exc}",
        }
    return {
        "google_day": _usage_window(db, google_day_start),
        "last_7_days": _usage_window(db, now - timedelta(days=7)),
        "month_to_date": _usage_window(db, month_start),
        "google_day_resets_at": (
            (now_pt.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1))
            .astimezone(timezone.utc)
            .isoformat()
        ),
        "latest_model": latest_model,
        "latest_provider": latest.provider if latest else None,
        "official_quota": official_quota,
    }


@app.post("/api/v1/content-index/resolve", response_model=ContentIndexResponse)
def resolve_content_index(payload: ContentIndexRequest, db: DbSession):
    settings = get_settings()
    segment_payloads = [segment.model_dump() for segment in payload.segments]
    fingerprint = content_fingerprint(segment_payloads)

    identity = (
        IndexedContent.provider == payload.provider,
        IndexedContent.external_id == payload.external_id,
        IndexedContent.source_language == payload.source_language,
        IndexedContent.target_language == payload.target_language,
        IndexedContent.content_hash == fingerprint,
        IndexedContent.analysis_schema_version == settings.ai_analysis_schema_version,
    )
    existing = db.scalar(select(IndexedContent).where(*identity))
    if existing is not None and existing.status == "ready":
        return serialize_indexed_content(existing)
    if existing is not None and existing.status == "processing":
        raise HTTPException(status_code=409, detail="content analysis is already in progress")

    # Snapshot sentence-level AI cache before a failed exact-hash record is
    # cleared for retry. This preserves successfully committed earlier batches.
    previous_by_text, previous = _historical_ai_segments_by_text(
        db, payload, settings.ai_analysis_schema_version
    )

    if existing is None:
        content = IndexedContent(
            provider=payload.provider,
            source_type=payload.source_type,
            external_id=payload.external_id,
            url=payload.url,
            title=payload.title,
            source_language=payload.source_language,
            target_language=payload.target_language,
            content_hash=fingerprint,
            analysis_schema_version=settings.ai_analysis_schema_version,
            status="processing",
            metadata_json=payload.metadata,
        )
        db.add(content)
    else:
        content = existing
        content.status = "processing"
        content.url = payload.url or content.url
        content.title = payload.title or content.title
        content.metadata_json = payload.metadata
        for old_segment in list(content.segments):
            db.delete(old_segment)
    db.commit()
    db.refresh(content)

    analyzer_provider = previous.analyzer_provider if previous is not None else None
    analyzer_model = previous.analyzer_model if previous is not None else None
    reused_segment_ids = set()

    reused_count = 0
    local_count = 0
    pending_segments = []
    persisted_indexes = set()

    try:
        # Persist cache/local matches first so the status endpoint can expose them
        # immediately while the external AI batches are still running.
        for source in segment_payloads:
            item = _local_metadata_analysis(source, payload.target_language)
            if item is not None:
                _persist_indexed_segment(db, content, source, item)
                persisted_indexes.add(source["index"])
                local_count += 1
                continue

            normalized = _normalized_segment_text(source["text"])
            candidates = previous_by_text.get(normalized, [])
            reused = next(
                (candidate for candidate in candidates if candidate["segment_id"] not in reused_segment_ids),
                None,
            )
            if reused is not None:
                reused_segment_ids.add(reused["segment_id"])
                item = {
                    "index": source["index"],
                    "sentence_translation": reused["translation_text"],
                    "tokens": reused["tokens"],
                    "expressions": reused["expressions"],
                    "analysis_source": "ai",
                }
                _persist_indexed_segment(db, content, source, item)
                persisted_indexes.add(source["index"])
                reused_count += 1
            else:
                pending_segments.append(source)

        batch_size = max(1, min(settings.ai_batch_segments, 8))
        chunks = [
            pending_segments[offset:offset + batch_size]
            for offset in range(0, len(pending_segments), batch_size)
        ]
        total_batches = len(chunks)
        completed_batches = 0
        content.metadata_json = {
            **(content.metadata_json or {}),
            "progress": {
                "completed_batches": 0,
                "total_batches": total_batches,
                "completed_segments": len(persisted_indexes),
                "total_segments": len(segment_payloads),
            },
        }
        db.commit()

        concurrency = max(1, min(settings.ai_batch_concurrency, 4))
        if chunks:
            with ThreadPoolExecutor(max_workers=concurrency) as pool:
                future_map = {
                    pool.submit(
                        analyze_content_batch,
                        payload.source_language,
                        payload.target_language,
                        chunk,
                        title=payload.title,
                        provider=payload.provider,
                    ): (batch_index, chunk)
                    for batch_index, chunk in enumerate(chunks, start=1)
                }
                for future in as_completed(future_map):
                    batch_index, chunk = future_map[future]
                    try:
                        result = future.result()
                    except Exception as exc:
                        indexes = [item.get("index") for item in chunk]
                        raise RuntimeError(
                            f"AI batch {batch_index}/{total_batches} failed "
                            f"(segment indexes {indexes[0] if indexes else '?'}..{indexes[-1] if indexes else '?'}): {exc}"
                        ) from exc

                    _record_ai_usage(db, result, content_id=content.id, batch_index=batch_index)
                    analyzer_provider = result.get("provider") or analyzer_provider
                    analyzer_model = result.get("model") or analyzer_model
                    by_index = {
                        int(item["index"]): item
                        for item in result.get("analysis", {}).get("segments", [])
                    }
                    missing_chunk = {source["index"] for source in chunk} - set(by_index)
                    if missing_chunk:
                        raise RuntimeError(
                            f"AI analyzer omitted segments in batch {batch_index}: "
                            f"{sorted(missing_chunk)[:20]}"
                        )

                    for source in chunk:
                        item = by_index[source["index"]]
                        item["analysis_source"] = "ai"
                        _persist_indexed_segment(db, content, source, item)
                        persisted_indexes.add(source["index"])

                    completed_batches += 1
                    content.analyzer_provider = analyzer_provider
                    content.analyzer_model = analyzer_model
                    content.metadata_json = {
                        **(content.metadata_json or {}),
                        "progress": {
                            "completed_batches": completed_batches,
                            "total_batches": total_batches,
                            "completed_segments": len(persisted_indexes),
                            "total_segments": len(segment_payloads),
                        },
                    }
                    # Commit every completed batch. A polling client can use these
                    # rows immediately instead of waiting for the whole article.
                    db.commit()
                    db.refresh(content)

        expected_indexes = {item["index"] for item in segment_payloads}
        missing = expected_indexes - persisted_indexes
        if missing:
            raise RuntimeError(f"AI analyzer omitted segments: {sorted(missing)[:20]}")

        if analyzer_provider is None and not pending_segments:
            analyzer_provider = "local"
            analyzer_model = None

        content.analyzer_provider = analyzer_provider
        content.analyzer_model = analyzer_model
        content.status = "ready"
        content.metadata_json = {
            **(content.metadata_json or {}),
            "progress": {
                "completed_batches": total_batches,
                "total_batches": total_batches,
                "completed_segments": len(segment_payloads),
                "total_segments": len(segment_payloads),
            },
        }
        db.commit()
        db.refresh(content)
    except Exception as exc:
        db.rollback()
        failed = db.get(IndexedContent, content.id)
        if failed is not None:
            failed.status = "failed"
            failed.metadata_json = {
                **(failed.metadata_json or {}),
                "analysis_error": str(exc)[:2000],
            }
            db.commit()
        raise HTTPException(status_code=502, detail=f"content AI analysis failed: {exc}") from exc

    result = serialize_indexed_content(content)
    result["cached"] = len(pending_segments) == 0
    result["reused_segments"] = reused_count
    result["ai_analyzed_segments"] = len(pending_segments)
    result["local_segments"] = local_count
    return result


@app.get("/api/v1/content-index/{content_id}", response_model=ContentIndexResponse)
def get_content_index(content_id: UUID, db: DbSession):
    content = db.get(IndexedContent, content_id)
    if content is None or content.status != "ready":
        raise HTTPException(status_code=404, detail="indexed content not found")
    return serialize_indexed_content(content)


@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest):
    try:
        analysis = analyze_text(payload.source_language, payload.text)
    except UnsupportedLanguageError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"language engine failed: {exc}") from exc
    return {"analysis": analysis}


@app.post("/api/v1/tokens-batch")
def tokens_batch(payload: TokenBatchRequest):
    try:
        items = analyze_tokens_batch(payload.source_language, payload.texts)
    except UnsupportedLanguageError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"language engine failed: {exc}") from exc
    return {"items": items}


@app.post("/api/v1/learning-units-batch")
def learning_units_batch(payload: TokenBatchRequest):
    try:
        items = analyze_learning_units_batch(payload.source_language, payload.texts)
    except UnsupportedLanguageError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"language engine failed: {exc}") from exc
    return {"items": items}


@app.post("/api/v1/expression-groups-batch")
def expression_groups_batch(payload: TokenBatchRequest):
    try:
        items = analyze_expression_groups_batch(payload.source_language, payload.texts)
    except UnsupportedLanguageError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"language engine failed: {exc}") from exc
    return {"items": items}


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


def _indexed_learning_encounters(db: Session, item: LearningItem, encounters: list[Encounter]):
    """Recover sentence context from indexed AI content when an old encounter is missing/wrong."""
    descriptors: list[tuple[str, str]] = []
    for encounter in encounters:
        source = db.get(ContentSource, encounter.source_id) if encounter.source_id else None
        if source and (source.provider, source.external_id) not in descriptors:
            descriptors.append((source.provider, source.external_id))

    content_source = (item.metadata_json or {}).get("content_source") or {}
    meta_provider = str(content_source.get("provider") or "").strip()
    meta_external_id = str(
        content_source.get("externalId") or content_source.get("external_id") or ""
    ).strip()
    if meta_provider and meta_external_id and (meta_provider, meta_external_id) not in descriptors:
        descriptors.append((meta_provider, meta_external_id))

    if not descriptors:
        return []

    canonical_key = str(item.canonical_key or "").strip().lower()
    canonical_form = str(item.canonical_form or "").strip().lower()
    recovered_sentences: set[str] = set()
    recovered = []

    for provider, external_id in descriptors:
        contents = list(db.scalars(
            select(IndexedContent)
            .where(
                IndexedContent.provider == provider,
                IndexedContent.external_id == external_id,
                IndexedContent.status.in_(["ready", "failed"]),
            )
            .order_by(IndexedContent.analyzed_at.desc(), IndexedContent.created_at.desc())
        ))
        for content in contents:
            for segment in content.segments:
                sentence = str(segment.source_text or "").strip()
                if not sentence or sentence in recovered_sentences:
                    continue
                analysis = segment.analysis_json or {}
                matched_surface = ""
                matched_contextual_meaning = ""
                matched_dictionary_meanings: list[str] = []

                if item.category == "expression":
                    for expression in analysis.get("expressions", []):
                        expression_key = str(expression.get("pattern_id") or "").strip().lower()
                        expression_canonical = str(expression.get("canonical") or "").strip().lower()
                        if (
                            (canonical_key and expression_key == canonical_key)
                            or (canonical_form and expression_canonical == canonical_form)
                        ):
                            matched_surface = str(
                                expression.get("surface") or expression.get("canonical") or item.canonical_form
                            ).strip()
                            matched_contextual_meaning = str(
                                expression.get("contextual_meaning_tr") or ""
                            ).strip()
                            raw_meanings = expression.get("meaning_tr") or []
                            if isinstance(raw_meanings, list):
                                matched_dictionary_meanings = [
                                    str(value).strip() for value in raw_meanings if str(value).strip()
                                ]
                            break

                    # Older saves can store an expression by a broad canonical
                    # form while the indexed segment only exposes lexical token
                    # lemmas (for example: "etwas vorsehen" -> "sieht ... vor").
                    # Do not fall back to a generic auxiliary such as "sein":
                    # that produced false matches against "ist", "war", "seiner", etc.
                    if not matched_surface:
                        ignored_words = {
                            "etwas", "etw", "jemand", "jemanden", "jemandem",
                            "jmd", "jmdn", "jmdm", "sich", "zu",
                            "sein", "haben", "werden",
                            "der", "die", "das", "den", "dem", "des",
                            "ein", "eine", "einen", "einem", "einer", "eines",
                        }
                        canonical_words = [
                            part.strip(".,;:!?()[]{}\"'").lower()
                            for part in canonical_form.split()
                            if part.strip(".,;:!?()[]{}\"'")
                        ]
                        content_words = [word for word in canonical_words if word not in ignored_words]
                        lexical_head = content_words[-1] if content_words else ""
                        segment_lexemes = set()
                        for token in analysis.get("tokens", []):
                            lemma = str(token.get("lemma") or "").strip().lower()
                            surface = str(token.get("surface") or token.get("text") or "").strip().lower()
                            if lemma:
                                segment_lexemes.add(lemma)
                            if surface:
                                segment_lexemes.add(surface)

                        matched_content_words = {
                            word for word in content_words if word in segment_lexemes
                        }

                        # Require the complete meaningful canonical skeleton.
                        # Partial overlap such as "auf" + "bringen" must not
                        # recover "etwas auf den Weg bringen" from an unrelated
                        # sentence containing "auf ... brachte".
                        has_full_canonical_evidence = bool(content_words) and (
                            len(matched_content_words) == len(set(content_words))
                        )

                        if (
                            lexical_head
                            and lexical_head in segment_lexemes
                            and has_full_canonical_evidence
                        ):
                            for token in analysis.get("tokens", []):
                                lemma = str(token.get("lemma") or "").strip().lower()
                                if lemma != lexical_head:
                                    continue
                                matched_surface = str(
                                    token.get("surface")
                                    or token.get("text")
                                    or token.get("lemma")
                                    or item.canonical_form
                                ).strip()
                                # This is only a lexical recovery aid. A token
                                # meaning (for example separable particle "vor")
                                # is not the meaning of the saved whole
                                # expression ("etwas vorsehen"), so leave the
                                # expression meaning empty and let the saved
                                # learning-unit translation remain primary.
                                break
                else:
                    for token in analysis.get("tokens", []):
                        lemma = str(token.get("lemma") or "").strip().lower()
                        if lemma and lemma in {canonical_key, canonical_form}:
                            matched_surface = str(
                                token.get("surface") or token.get("text") or token.get("lemma") or item.canonical_form
                            ).strip()
                            matched_contextual_meaning = str(
                                token.get("contextual_meaning_tr") or ""
                            ).strip()
                            raw_meanings = token.get("dictionary_meanings_tr") or []
                            if isinstance(raw_meanings, list):
                                matched_dictionary_meanings = [
                                    str(value).strip() for value in raw_meanings if str(value).strip()
                                ]
                            break

                if not matched_surface:
                    continue

                is_timed_media = content.source_type == "video" or content.provider in {"youtube", "zdf"}
                recovered.append({
                    "id": f"indexed:{segment.id}:{item.id}",
                    "surface_form": matched_surface,
                    "sentence": sentence,
                    "media_timestamp_ms": segment.start_ms if is_timed_media else None,
                    "media_end_timestamp_ms": segment.end_ms if is_timed_media else None,
                    "encountered_at": content.analyzed_at or content.created_at,
                    "context": {
                        "derived_from": "indexed-content",
                        "segment_index": segment.sequence_index,
                        "contextual_meaning_tr": matched_contextual_meaning,
                        "dictionary_meanings_tr": matched_dictionary_meanings,
                    },
                    "source": {
                        "provider": content.provider,
                        "source_type": content.source_type,
                        "external_id": content.external_id,
                        "url": content.url,
                        "title": content.title,
                    },
                })
                recovered_sentences.add(sentence)
                if len(recovered) >= 3:
                    return recovered

    return recovered


def serialize_learning_item(db: Session, item: LearningItem):
    encounters = db.scalars(
        select(Encounter)
        .where(Encounter.learning_item_id == item.id)
        .order_by(Encounter.encountered_at.desc())
    ).all()
    serialized_encounters = [{
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
    } for encounter in encounters]
    serialized_encounters.extend(_indexed_learning_encounters(db, item, encounters))
    return {
        "id": item.id,
        "canonical_form": item.canonical_form,
        "canonical_key": item.canonical_key,
        "category": item.category,
        "language_specific_type": item.language_specific_type,
        "status": item.status,
        "translations": [{"language": t.language, "meaning": t.meaning} for t in item.translations],
        "examples": serialize_examples(db, item.canonical_key) if item.category == "word" else [],
        "encounters": serialized_encounters,
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
