from __future__ import annotations
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
    EncounterCreate,
    LearningItemCreate,
    LearningProfileCreate,
    UserCreate,
)
from .services import UnsupportedLanguageError, analyze_text, match_learning_items


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


app = FastAPI(title="Language Learning Platform API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().allowed_origins(),
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
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    user = User(external_subject=payload.external_subject)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "external_subject": user.external_subject}


@app.post("/api/v1/profiles")
def create_profile(payload: LearningProfileCreate, db: Session = Depends(get_db)):
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


@app.post("/api/v1/analyze-and-match", response_model=AnalyzeAndMatchResponse)
def analyze_and_match(payload: AnalyzeAndMatchRequest, db: Session = Depends(get_db)):
    try:
        analysis = analyze_text(payload.source_language, payload.text)
    except UnsupportedLanguageError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"language engine failed: {exc}") from exc
    return {"analysis": analysis, "learning_matches": match_learning_items(db, payload.profile_id, analysis)}


@app.get("/api/v1/learning-items")
def list_learning_items(profile_id: UUID, db: Session = Depends(get_db)):
    items = db.scalars(select(LearningItem).where(LearningItem.profile_id == profile_id).order_by(LearningItem.created_at.desc())).all()
    return {"items": [{
        "id": item.id,
        "canonical_form": item.canonical_form,
        "canonical_key": item.canonical_key,
        "category": item.category,
        "language_specific_type": item.language_specific_type,
        "status": item.status,
        "translations": [{"language": t.language, "meaning": t.meaning} for t in item.translations],
    } for item in items]}


@app.post("/api/v1/learning-items")
def create_learning_item(payload: LearningItemCreate, db: Session = Depends(get_db)):
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
    if payload.meaning and payload.meaning_language:
        db.add(LearningItemTranslation(learning_item_id=item.id, language=payload.meaning_language, meaning=payload.meaning))
    db.commit()
    db.refresh(item)
    return {"id": item.id, "status": item.status}


@app.post("/api/v1/encounters")
def create_encounter(payload: EncounterCreate, db: Session = Depends(get_db)):
    source = db.scalar(select(ContentSource).where(
        ContentSource.provider == payload.provider,
        ContentSource.external_id == payload.external_id,
    ))
    if source is None:
        source = ContentSource(provider=payload.provider, source_type=payload.source_type, external_id=payload.external_id, url=payload.url, title=payload.title)
        db.add(source)
        db.flush()
    encounter = Encounter(
        learning_item_id=payload.learning_item_id,
        source_id=source.id,
        surface_form=payload.surface_form,
        sentence=payload.sentence,
        media_timestamp_ms=payload.media_timestamp_ms,
        context_json=payload.context,
    )
    db.add(encounter)
    db.commit()
    db.refresh(encounter)
    return {"id": encounter.id}
