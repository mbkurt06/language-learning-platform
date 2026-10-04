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

Core rules — use the same standard as the manually curated Tagesschau benchmark:
1. SENTENCE TRANSLATION: Translate naturally into Turkish according to the real meaning
   in context. Never preserve German word order just to stay literal. Preserve tone:
   news should sound like natural Turkish news; dialogue/cartoon subtitles should sound
   like natural spoken Turkish. Neighboring segments are context. If a subtitle is a
   fragment of a larger sentence, use the neighboring fragments to understand it, but
   translate only the current segment without duplicating adjacent content.
2. TOKEN MEANING: Return every lexical word occurrence as a token. Preserve exact surface
   form, lemma, POS, useful morphology, and the Turkish meaning/function it has IN THIS
   SENTENCE. Do not give the most common dictionary meaning when context requires another
   one. Pronouns, particles, auxiliaries and prepositions should describe their contextual
   function when that is more useful than a standalone dictionary gloss.
3. SEMANTIC GROUP FIRST: Detect the smallest sentence-level groups whose actual words
   jointly carry one coherent meaning. The expression.surface must reflect the words that
   occur in this sentence; contextual_meaning_tr must explain the meaning of that whole
   group in this sentence.
4. CANONICAL FORM SEPARATE FROM SURFACE: canonical is the reusable learning formula, not
   the inflected sentence wording. Replace variable arguments with useful placeholders.
   Examples:
     "geht davon aus" -> "von etwas ausgehen"
     "steht ... gegenüber" -> "jemandem gegenüberstehen"
     "regt sich Widerstand" -> "sich regen"
   The canonical form must never be invented from words that are absent from the sentence.
5. HIGHLIGHT THE WHOLE MEANING-BEARING GROUP: token_indices/highlight_parts should include
   all actual sentence words that a learner needs to see together to understand the
   contextual meaning, including sentence-specific argument/filler words when they are
   part of that semantic group. The reusable canonical form still uses placeholders.
   Example: for "über diese Reformen diskutiert", highlighting may include
   "über diese Reformen diskutiert", while canonical remains "über etwas diskutieren".
6. NESTED / OVERLAPPING STRUCTURES: When useful, return both the broader semantic group
   and smaller reusable structures inside it as separate overlapping expressions. This is
   how the curated benchmark represents sentence meaning and grammar at the same time.
7. DETECT LEARNING STRUCTURES: separable verbs, reflexive verbs, verb+preposition,
   reflexive verb+preposition, noun+verb, adjective+preposition, noun+preposition,
   function-verb constructions, collocations, idioms, fixed/grammar constructions.
8. WHOLE-EXPRESSION MEANING WINS: contextual_meaning_tr for an expression is the meaning
   of the entire expression, never merely the meaning of its head token or separable
   particle. Example: "sieht ... vor" -> "öngörmek / düzenlemede yer vermek", not a gloss
   for "vor" alone.
9. AVOID FALSE GROUPS: Do not create an expression merely because one preposition,
   auxiliary, particle or common verb appears. The returned surface/highlight must be
   supported by the actual sentence.
10. TURKISH QUALITY CHECK: Before returning, verify that every sentence translation and
   contextual meaning is idiomatic Turkish, grammatically complete where the source is
   complete, and semantically compatible with the surrounding segments.
11. Return strict JSON only, no markdown.

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
          "contextual_meaning_tr": "...",
          "dictionary_meanings_tr": ["..."]
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


def _usage_from_response(raw: dict[str, Any]) -> dict[str, int]:
    usage = raw.get("usageMetadata") or raw.get("usage_metadata") or {}
    return {
        "request_count": 1,
        "input_tokens": int(usage.get("promptTokenCount") or usage.get("prompt_token_count") or 0),
        "output_tokens": int(usage.get("candidatesTokenCount") or usage.get("candidates_token_count") or 0),
        "total_tokens": int(usage.get("totalTokenCount") or usage.get("total_token_count") or 0),
        "cached_tokens": int(usage.get("cachedContentTokenCount") or usage.get("cached_content_token_count") or 0),
    }


def _sum_usage(*items: dict[str, int]) -> dict[str, int]:
    keys=("request_count","input_tokens","output_tokens","total_tokens","cached_tokens")
    return {key: sum(int(item.get(key, 0)) for item in items) for key in keys}



def _analysis_issues(payload: AnalyzeBatchRequest, parsed: dict[str, Any]) -> list[str]:
    issues: list[str] = []
    segments = parsed.get("segments")
    if not isinstance(segments, list):
        return ["segments must be a list"]

    expected = {item.index: item for item in payload.segments}
    returned: dict[int, dict[str, Any]] = {}
    for raw in segments:
        if not isinstance(raw, dict):
            issues.append("segment entry is not an object")
            continue
        try:
            index = int(raw.get("index"))
        except (TypeError, ValueError):
            issues.append("segment has invalid/missing index")
            continue
        if index in returned:
            issues.append(f"segment {index}: duplicate result")
            continue
        returned[index] = raw

    missing = sorted(set(expected) - set(returned))
    unexpected = sorted(set(returned) - set(expected))
    if missing:
        issues.append(f"missing segment indexes: {missing}")
    if unexpected:
        issues.append(f"unexpected segment indexes: {unexpected}")

    for index, source in expected.items():
        item = returned.get(index)
        if item is None:
            continue

        if not str(item.get("sentence_translation") or "").strip():
            issues.append(f"segment {index}: sentence_translation is blank")

        tokens = item.get("tokens")
        if not isinstance(tokens, list):
            issues.append(f"segment {index}: tokens must be a list")
            tokens = []

        token_indexes: set[int] = set()
        for offset, token in enumerate(tokens):
            if not isinstance(token, dict):
                issues.append(f"segment {index}: token {offset} is not an object")
                continue
            try:
                token_i = int(token.get("i"))
            except (TypeError, ValueError):
                issues.append(f"segment {index}: token {offset} has invalid i")
                continue
            if token_i in token_indexes:
                issues.append(f"segment {index}: duplicate token index {token_i}")
            token_indexes.add(token_i)

            surface = str(token.get("surface") or "").strip()
            lemma = str(token.get("lemma") or "").strip()
            meaning = str(token.get("contextual_meaning_tr") or "").strip()
            if not surface:
                issues.append(f"segment {index}: token {token_i} surface is blank")
            if not lemma:
                issues.append(f"segment {index}: token {token_i} lemma is blank")
            if not meaning:
                issues.append(
                    f"segment {index}: token {token_i} ({surface or lemma or '?'}) contextual_meaning_tr is blank"
                )

        if any(ch.isalnum() for ch in source.text) and not tokens:
            issues.append(f"segment {index}: lexical source has no tokens")

        expressions = item.get("expressions")
        if not isinstance(expressions, list):
            issues.append(f"segment {index}: expressions must be a list")
            expressions = []

        for offset, expression in enumerate(expressions):
            if not isinstance(expression, dict):
                issues.append(f"segment {index}: expression {offset} is not an object")
                continue
            if not str(expression.get("canonical") or "").strip():
                issues.append(f"segment {index}: expression {offset} canonical is blank")
            if not str(expression.get("surface") or "").strip():
                issues.append(f"segment {index}: expression {offset} surface is blank")
            if not str(expression.get("contextual_meaning_tr") or "").strip():
                issues.append(f"segment {index}: expression {offset} contextual_meaning_tr is blank")

            raw_indices = expression.get("token_indices")
            if not isinstance(raw_indices, list) or not raw_indices:
                issues.append(f"segment {index}: expression {offset} token_indices is empty")
            else:
                bad = []
                for value in raw_indices:
                    try:
                        parsed_index = int(value)
                    except (TypeError, ValueError):
                        bad.append(value)
                        continue
                    if parsed_index not in token_indexes:
                        bad.append(value)
                if bad:
                    issues.append(
                        f"segment {index}: expression {offset} token_indices not present in tokens: {bad}"
                    )

            highlights = expression.get("highlight_parts")
            if not isinstance(highlights, list) or not any(str(value).strip() for value in highlights):
                issues.append(f"segment {index}: expression {offset} highlight_parts is empty")

    return issues


def _repair_instruction(parsed: dict[str, Any], issues: list[str]) -> str:
    return (
        "QUALITY GATE REPAIR REQUIRED. The previous JSON was parseable but violates "
        "the learning-platform contract. Repair the COMPLETE response, not only the "
        "listed fields. Do not omit any input segment or lexical token. Every lexical "
        "token must have a non-empty contextual_meaning_tr. Every expression must have "
        "a whole-expression contextual meaning, canonical form, real sentence surface, "
        "valid token_indices and highlight_parts. Re-check Turkish naturalness and the "
        "semantic-group/canonical distinction. Return ONLY the complete corrected JSON.\n\n"
        "ISSUES:\n- " + "\n- ".join(issues[:120]) + "\n\n"
        "PREVIOUS JSON:\n" + json.dumps(parsed, ensure_ascii=False)
    )


def call_gemini(payload: AnalyzeBatchRequest) -> tuple[dict[str, Any], dict[str, int]]:
    model = gemini_model()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    prompt = analyzer_prompt(payload)

    def request_once(extra_instruction: str = "") -> tuple[dict[str, Any], str]:
        effective_prompt = prompt
        if extra_instruction:
            effective_prompt += "\n\n" + extra_instruction
        body = {
            "contents": [{"role": "user", "parts": [{"text": effective_prompt}]}],
            "generationConfig": {
                "temperature": 0,
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
        return raw, text

    raw, text = request_once()
    usage = _usage_from_response(raw)
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        retry_raw, text = request_once(
            "IMPORTANT RETRY: Your previous response was not valid JSON. "
            "Return ONLY one complete valid JSON object matching the requested schema. "
            "Do not use markdown, comments, trailing commas, NaN, undefined, or explanatory text."
        )
        usage = _sum_usage(usage, _usage_from_response(retry_raw))
        raw = retry_raw
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError as retry_exc:
            start = max(0, retry_exc.pos - 220)
            end = min(len(text), retry_exc.pos + 220)
            excerpt = text[start:end].replace("\n", "\\n")
            finish_reason = (
                ((raw.get("candidates") or [{}])[0]).get("finishReason")
                or ((raw.get("candidates") or [{}])[0]).get("finish_reason")
                or ""
            )
            raise RuntimeError(
                "Gemini returned invalid JSON after retry: "
                f"{retry_exc.msg} at line {retry_exc.lineno} column {retry_exc.colno}; "
                f"finish_reason={finish_reason or 'unknown'}; excerpt={excerpt}"
            ) from retry_exc

    if not isinstance(parsed, dict) or not isinstance(parsed.get("segments"), list):
        raise RuntimeError("Gemini response does not match the expected analysis shape")

    issues = _analysis_issues(payload, parsed)
    if issues:
        repair_raw, repair_text = request_once(_repair_instruction(parsed, issues))
        usage = _sum_usage(usage, _usage_from_response(repair_raw))
        try:
            repaired = json.loads(repair_text)
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                f"Gemini quality-gate repair returned invalid JSON: {exc.msg} "
                f"at line {exc.lineno} column {exc.colno}"
            ) from exc

        if not isinstance(repaired, dict) or not isinstance(repaired.get("segments"), list):
            raise RuntimeError("Gemini quality-gate repair does not match expected analysis shape")

        remaining = _analysis_issues(payload, repaired)
        if remaining:
            raise RuntimeError(
                "Gemini analysis failed semantic completeness gate after repair: "
                + " | ".join(remaining[:40])
            )
        parsed = repaired

    return parsed, usage


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
        analysis, usage = call_gemini(payload)
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text[:1000]
        raise HTTPException(status_code=502, detail=f"Gemini request failed: {detail}") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {exc}") from exc
    return {
        "provider": provider,
        "model": gemini_model(),
        "analysis": analysis,
        "usage": usage,
    }
