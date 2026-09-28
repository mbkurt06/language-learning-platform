#!/usr/bin/env python3
"""Build reviewable promotion batches from normalized external lexicon candidates.

This is the second stage after import_external_lexicons.py:

  raw external resources
      -> normalized candidate queue
      -> promotion batch (this script)
      -> Turkish meaning review
      -> bundled runtime lexicon

The script deliberately does not write directly into the runtime data directory.
It applies repeatable quality gates in bulk and separates ready candidates from
items that still require structural/manual review.
"""
from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Any

import yaml


TIER_ORDER = {"A": 0, "B": 1, "C": 2}

# These are known corpus groupings that cannot safely map to one canonical
# learner expression without sentence-level context.
CONTEXT_SENSITIVE_CANONICALS = {
    "es gehen": "context_sensitive_split_required",
}


def source_categories(item: dict[str, Any]) -> set[str]:
    return {str(value) for value in item.get("source_category", [])}


def promotion_tier(item: dict[str, Any]) -> str | None:
    cats = source_categories(item)
    if "VerbframesDE" in cats:
        return None

    evidence = int(item.get("evidence_count", 0) or 0)
    if evidence >= 10:
        return "A"
    if evidence >= 3:
        return "B"
    return "C"


def _slot_types(item: dict[str, Any]) -> list[str]:
    return [str(slot.get("type", "")) for slot in item.get("slots", [])]


def quality_reasons(item: dict[str, Any]) -> list[str]:
    reasons: list[str] = []
    canonical = str(item.get("canonical", "")).strip()
    head = str(item.get("head_lemma", "")).strip()
    expression_type = str(item.get("type", ""))
    slots = item.get("slots", []) or []
    slot_types = _slot_types(item)

    if not canonical:
        reasons.append("missing_canonical")
    if not head:
        reasons.append("missing_head_lemma")
    if "|" in canonical:
        reasons.append("ambiguous_canonical")
    if canonical in CONTEXT_SENSITIVE_CANONICALS:
        reasons.append(CONTEXT_SENSITIVE_CANONICALS[canonical])

    if expression_type == "PARTICLE_VERB":
        if "PARTICLE" not in slot_types:
            reasons.append("particle_verb_without_particle_slot")
        bad = [slot for slot in slots if slot.get("type") in {"PREPOSITION", "LEMMA"}]
        if bad:
            reasons.append("particle_verb_has_non_particle_prefix_slot")

    if expression_type == "REFLEXIVE_VERB" and "REFLEXIVE" not in slot_types:
        reasons.append("reflexive_verb_without_reflexive_slot")

    if expression_type == "FIXED_CONSTRUCTION" and not slots:
        reasons.append("fixed_construction_without_slots")

    return reasons


def batch_item(item: dict[str, Any], tier: str, reasons: list[str]) -> dict[str, Any]:
    runtime_fields = {
        key: item.get(key)
        for key in (
            "id",
            "canonical",
            "type",
            "head_lemma",
            "slots",
            "meaning_tr",
            "priority",
            "notes",
        )
        if key in item
    }
    runtime_fields.update({
        "promotion_tier": tier,
        "promotion_status": "ready_for_translation" if not reasons else "needs_review",
        "review_reasons": reasons,
        "evidence_count": int(item.get("evidence_count", 0) or 0),
        "source_category": item.get("source_category", []),
        "source": item.get("source", []),
    })
    return runtime_fields


def build_batch(
    items: list[dict[str, Any]],
    tier: str,
    max_items: int | None = None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    selected = [item for item in items if promotion_tier(item) == tier]
    selected.sort(
        key=lambda item: (
            -int(item.get("evidence_count", 0) or 0),
            str(item.get("type", "")),
            str(item.get("canonical", "")).casefold(),
        )
    )
    if max_items is not None:
        selected = selected[:max_items]

    ready: list[dict[str, Any]] = []
    review: list[dict[str, Any]] = []
    for item in selected:
        reasons = quality_reasons(item)
        target = review if reasons else ready
        target.append(batch_item(item, tier, reasons))
    return ready, review


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--tier", choices=sorted(TIER_ORDER), default="A")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--review-output", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    parser.add_argument("--max-items", type=int)
    args = parser.parse_args()

    items = yaml.safe_load(args.input.read_text(encoding="utf-8")) or []
    ready, review = build_batch(items, args.tier, args.max_items)

    for path in (args.output, args.review_output, args.report):
        path.parent.mkdir(parents=True, exist_ok=True)

    args.output.write_text(
        yaml.safe_dump(ready, allow_unicode=True, sort_keys=False, width=110),
        encoding="utf-8",
    )
    args.review_output.write_text(
        yaml.safe_dump(review, allow_unicode=True, sort_keys=False, width=110),
        encoding="utf-8",
    )

    report = {
        "tier": args.tier,
        "ready_for_translation": len(ready),
        "needs_review": len(review),
        "ready_by_type": dict(Counter(item["type"] for item in ready)),
        "review_by_reason": dict(
            Counter(reason for item in review for reason in item["review_reasons"])
        ),
        "promotion_rule": (
            "Only structurally clean candidates enter the translation batch. "
            "Runtime lexicon promotion still requires curated Turkish meanings."
        ),
    }
    args.report.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
