from __future__ import annotations
from typing import Any
import hashlib
import json
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


def analyze_learning_units_batch(source_language: str, texts: list[str]) -> list[dict[str, Any]]:
    engine_url = get_settings().engine_urls().get(source_language)
    if not engine_url:
        raise UnsupportedLanguageError(f"No language engine configured for {source_language!r}")
    with httpx.Client(timeout=60.0) as client:
        response = client.post(f"{engine_url}/learning-units-batch", json={"texts": texts})
        response.raise_for_status()
        payload = response.json()
        return payload.get("items", [])


def content_fingerprint(segments: list[dict[str, Any]]) -> str:
    payload = [
        {
            "index": int(item.get("index", 0)),
            "text": " ".join(str(item.get("text", "")).split()),
            "start_ms": item.get("start_ms"),
            "end_ms": item.get("end_ms"),
        }
        for item in segments
    ]
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def analyze_content_batch(
    source_language: str,
    target_language: str,
    segments: list[dict[str, Any]],
    *,
    title: str | None = None,
    provider: str | None = None,
) -> dict[str, Any]:
    settings = get_settings()
    with httpx.Client(timeout=150.0) as client:
        response = client.post(
            f"{settings.ai_analyzer_url.rstrip('/')}/analyze-batch",
            json={
                "source_language": source_language,
                "target_language": target_language,
                "segments": segments,
                "context_title": title,
                "context_provider": provider,
            },
        )
        response.raise_for_status()
        return response.json()
