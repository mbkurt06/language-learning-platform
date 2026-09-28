from __future__ import annotations
from typing import Any
import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session
from .config import get_settings
from .models import LearningItem


class UnsupportedLanguageError(ValueError):
    pass


def analyze_text(source_language: str, text: str) -> dict[str, Any]:
    engine_url = get_settings().engine_urls().get(source_language)
    if not engine_url:
        raise UnsupportedLanguageError(f"No language engine configured for {source_language!r}")
    with httpx.Client(timeout=12.0) as client:
        response = client.post(f"{engine_url}/analyze", json={"text": text})
        response.raise_for_status()
        return response.json()


def normalized_candidates(analysis: dict[str, Any]) -> list[dict[str, Any]]:
    candidates = []
    for expression in analysis.get("expressions", []):
        candidates.append({
            "canonical_key": str(expression.get("pattern_id") or expression.get("canonical", "")).lower(),
            "canonical": expression.get("canonical", ""),
            "surface": expression.get("surface", ""),
            "category": "expression",
        })
    for token in analysis.get("tokens", []):
        lemma = str(token.get("lemma") or token.get("text") or "").strip()
        if lemma:
            candidates.append({
                "canonical_key": lemma.lower(),
                "canonical": lemma,
                "surface": token.get("text", lemma),
                "category": "word",
            })
    return candidates


def match_learning_items(db: Session, profile_id, analysis: dict[str, Any]) -> list[dict[str, Any]]:
    items = list(db.scalars(select(LearningItem).where(
        LearningItem.profile_id == profile_id,
        LearningItem.status == "learning",
    )))
    by_key = {item.canonical_key.lower(): item for item in items}
    matches = []
    for candidate in normalized_candidates(analysis):
        item = by_key.get(candidate["canonical_key"])
        if not item:
            continue
        meaning = item.translations[0].meaning if item.translations else None
        matches.append({
            "learning_item_id": item.id,
            "canonical": item.canonical_form,
            "surface": candidate["surface"],
            "meaning": meaning,
            "category": item.category,
        })
    return matches


def analyze_tokens_batch(source_language: str, texts: list[str]) -> list[dict[str, Any]]:
    engine_url = get_settings().engine_urls().get(source_language)
    if not engine_url:
        raise UnsupportedLanguageError(f"No language engine configured for {source_language!r}")
    with httpx.Client(timeout=20.0) as client:
        response = client.post(f"{engine_url}/tokens-batch", json={"texts": texts})
        response.raise_for_status()
        payload = response.json()
        return payload.get("items", [])


def analyze_expression_groups_batch(source_language: str, texts: list[str]) -> list[dict[str, Any]]:
    engine_url = get_settings().engine_urls().get(source_language)
    if not engine_url:
        raise UnsupportedLanguageError(f"No language engine configured for {source_language!r}")
    with httpx.Client(timeout=30.0) as client:
        response = client.post(f"{engine_url}/expression-groups-batch", json={"texts": texts})
        response.raise_for_status()
        payload = response.json()
        return payload.get("items", [])
