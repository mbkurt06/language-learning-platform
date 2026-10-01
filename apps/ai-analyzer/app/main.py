from __future__ import annotations

import json
import os
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


app = FastAPI(title="Language Learning AI Analyzer", version="0.1.0")


class SegmentIn(BaseModel):
    index: int
    text: str = Field(min_length=1)
    start_ms: int | None = None
    end_ms: int | None = None


class AnalyzeBatchRequest(BaseModel):
    source_language: str = "de"
    target_language: str = "tr"
    segments: list[SegmentIn] = Field(min_length=1, max_length=40)
    context_title: str | None = None
    context_provider: str | None = None


def gemini_model() -> str:
    return os.getenv("AI_MODEL", "gemini-2.5-flash-lite")


def gemini_key() -> str:
    value = os.getenv("GEMINI_API_KEY", "").strip()
    if not value:
        raise RuntimeError("GEMINI_API_KEY is not configured")
    return value


def analyzer_prompt(payload: AnalyzeBatchRequest) -> str:
    segment_lines = []
    for item in payload.segments:
        segment_lines.append(
            json.dumps(
                {
                    "index": item.index,
                    "text": item.text,
                    "start_ms": item.start_ms,
                    "end_ms": item.end_ms,
                },
                ensure_ascii=False,
            )
        )

    return f"""
You are the linguistic analysis engine of a language-learning platform.

SOURCE LANGUAGE: {payload.source_language}
TARGET LANGUAGE: {payload.target_language}
CONTENT PROVIDER: {payload.context_provider or ""}
CONTENT TITLE: {payload.context_title or ""}

Analyze each supplied German segment in its real context. Neighboring segments belong
to the same article/transcript and may be used as context, but return one result per
input segment.

Core rules:
1. Translate each segment naturally into Turkish. Do not translate word-for-word when
   German idiom or domain context requires a different Turkish expression.
2. Return every lexical word occurrence as a token. Preserve its exact surface form,
   lemma, POS, useful morphology, and the Turkish meaning it has IN THIS SEGMENT.
3. contextual_meaning_tr must be contextual. Example: in "Die gesetzlichen Kassen",
   "Kassen" means statutory health insurers / health-insurance funds, not cash/registers.
4. Detect reusable learning units and multiword constructions: separable verbs,
   reflexive verbs, verb+preposition, reflexive verb+preposition, noun+verb,
   adjective+preposition, noun+preposition, function-verb constructions,
   collocations, idioms and fixed constructions.
5. canonical must be a reusable dictionary/learning form, not the inflected surface.
   Examples: "geht davon aus" -> "von etwas ausgehen";
   "steht ... gegenüber" -> "jemandem gegenüberstehen".
6. expression token_indices must include ONLY fixed semantic members of the expression,
   not argument/slot fillers. Example: in "über diese Reformen diskutiert" for
   "über etwas diskutieren", include "über" and "diskutiert", not "Reformen".
7. highlight_parts must contain the actual surface words that should be highlighted.
8. Keep separate overlapping constructions when both are useful learning units.
9. Return strict JSON only, no markdown.

Return this exact shape:
{{
  "segments": [
    {{
      "index": 0,
      "sentence_translation": "...",
      "tokens": [
        {{
          "i": 0,
          "surface": "...",
          "lemma": "...",
          "pos": "NOUN|VERB|ADJ|ADV|ADP|PRON|DET|AUX|PART|SCONJ|CCONJ|PROPN|NUM|OTHER",
          "morphology": {{}},
          "contextual_meaning_tr": "..."
        }}
      ],
      "expressions": [
        {{
          "canonical": "...",
          "surface": "...",
          "type": "PARTICLE_VERB|REFLEXIVE_VERB|VERB_PREPOSITION|REFLEXIVE_VERB_PREPOSITION|NOUN_PREPOSITION|ADJECTIVE_PREPOSITION|FUNCTION_VERB|COLLOCATION|IDIOM|FIXED_CONSTRUCTION|GRAMMAR_CONSTRUCTION",
          "contextual_meaning_tr": "...",
          "grammar_hint": "...",
          "token_indices": [0, 2],
          "highlight_parts": ["...", "..."]
        }}
      ]
    }}
  ]
}}

INPUT SEGMENTS:
{chr(10).join(segment_lines)}
""".strip()


def call_gemini(payload: AnalyzeBatchRequest) -> dict[str, Any]:
    model = gemini_model()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    body = {
        "contents": [{"role": "user", "parts": [{"text": analyzer_prompt(payload)}]}],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
        },
    }
    with httpx.Client(timeout=120.0) as client:
        response = client.post(url, params={"key": gemini_key()}, json=body)
        response.raise_for_status()
        raw = response.json()

    candidates = raw.get("candidates") or []
    if not candidates:
        raise RuntimeError("Gemini returned no candidates")
    parts = candidates[0].get("content", {}).get("parts", [])
    text = "".join(str(part.get("text", "")) for part in parts).strip()
    if not text:
        raise RuntimeError("Gemini returned an empty response")
    parsed = json.loads(text)
    if not isinstance(parsed, dict) or not isinstance(parsed.get("segments"), list):
        raise RuntimeError("Gemini response does not match the expected analysis shape")
    return parsed


@app.get("/health")
def health():
    return {
        "status": "ok",
        "provider": os.getenv("AI_PROVIDER", "gemini"),
        "model": gemini_model(),
        "configured": bool(os.getenv("GEMINI_API_KEY", "").strip()),
    }


@app.post("/analyze-batch")
def analyze_batch(payload: AnalyzeBatchRequest):
    provider = os.getenv("AI_PROVIDER", "gemini").strip().lower()
    if provider != "gemini":
        raise HTTPException(status_code=422, detail=f"unsupported AI provider: {provider}")
    try:
        analysis = call_gemini(payload)
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text[:1000]
        raise HTTPException(status_code=502, detail=f"Gemini request failed: {detail}") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {exc}") from exc
    return {
        "provider": provider,
        "model": gemini_model(),
        "analysis": analysis,
    }
