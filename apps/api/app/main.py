from __future__ import annotations

from typing import Annotated
from uuid import UUID
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session
from .config import get_settings
from .db import SessionLocal
from .models import ContentSource, Encounter, LearningItem, LearningItemTranslation, LearningProfile, User
from .providers import provider_catalog
from .schemas import (
    AnalyzeAndMatchRequest,
    AnalyzeAndMatchResponse,
    AnalyzeRequest,
    AnalyzeResponse,
    EncounterCreate,
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
