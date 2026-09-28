from __future__ import annotations

import importlib.util
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "build_promotion_batch.py"
SPEC = importlib.util.spec_from_file_location("build_promotion_batch", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


def candidate(
    canonical: str,
    expression_type: str,
    slots: list[dict],
    evidence: int = 10,
    source_category: list[str] | None = None,
    head_lemma: str = "gehen",
) -> dict:
    return {
        "id": f"test.{canonical}",
        "canonical": canonical,
        "type": expression_type,
        "head_lemma": head_lemma,
        "slots": slots,
        "meaning_tr": [],
        "priority": 70,
        "source_category": source_category or ["VPC.full"],
        "source": ["fixture"],
        "evidence_count": evidence,
    }


def test_tier_a_is_parseme_with_at_least_ten_observations():
    item = candidate(
        "stattfinden",
        "PARTICLE_VERB",
        [{"id": "particle", "type": "PARTICLE", "lemma": "statt"}],
        evidence=27,
        head_lemma="finden",
    )
    assert MODULE.promotion_tier(item) == "A"


def test_verbframes_is_not_auto_promoted():
    item = candidate(
        "warten auf",
        "VERB_PREPOSITION",
        [{"id": "auf", "type": "PREPOSITION", "prep": "auf"}],
        evidence=50,
        source_category=["VerbframesDE"],
    )
    assert MODULE.promotion_tier(item) is None


def test_particle_verb_requires_particle_slots():
    item = candidate(
        "stattfinden",
        "PARTICLE_VERB",
        [{"id": "prep", "type": "PREPOSITION", "prep": "statt"}],
        evidence=27,
        head_lemma="finden",
    )
    reasons = MODULE.quality_reasons(item)
    assert "particle_verb_without_particle_slot" in reasons
    assert "particle_verb_has_non_particle_prefix_slot" in reasons


def test_context_sensitive_es_gehen_stays_in_review():
    item = candidate(
        "es gehen",
        "IDIOM",
        [{"id": "es", "type": "LEMMA", "lemma": "es"}],
        evidence=44,
        source_category=["VID"],
    )
    assert MODULE.quality_reasons(item) == ["context_sensitive_split_required"]


def test_build_batch_separates_ready_from_review():
    ready_item = candidate(
        "stattfinden",
        "PARTICLE_VERB",
        [{"id": "particle", "type": "PARTICLE", "lemma": "statt"}],
        evidence=27,
        head_lemma="finden",
    )
    review_item = candidate(
        "es gehen",
        "IDIOM",
        [{"id": "es", "type": "LEMMA", "lemma": "es"}],
        evidence=44,
        source_category=["VID"],
    )

    ready, review = MODULE.build_batch([review_item, ready_item], "A")

    assert [item["canonical"] for item in ready] == ["stattfinden"]
    assert ready[0]["promotion_status"] == "ready_for_translation"
    assert [item["canonical"] for item in review] == ["es gehen"]
    assert review[0]["promotion_status"] == "needs_review"


def test_particle_verb_canonical_must_match_particle_plus_head():
    item = candidate(
        "stellen ein",
        "PARTICLE_VERB",
        [{"id": "particle", "type": "PARTICLE", "lemma": "ein"}],
        evidence=3,
    )
    item["head_lemma"] = "stellen"

    assert "particle_verb_canonical_mismatch" in MODULE.quality_reasons(item)


def test_particle_verb_dictionary_form_passes_canonical_check():
    item = candidate(
        "einstellen",
        "PARTICLE_VERB",
        [{"id": "particle", "type": "PARTICLE", "lemma": "ein"}],
        evidence=3,
    )
    item["head_lemma"] = "stellen"

    assert "particle_verb_canonical_mismatch" not in MODULE.quality_reasons(item)


def test_build_batch_routes_duplicate_canonicals_to_review():
    first = candidate(
        "sich stellen",
        "REFLEXIVE_VERB",
        [{"id": "reflexive", "type": "REFLEXIVE"}],
        evidence=8,
    )
    first["head_lemma"] = "stellen"
    second = candidate(
        "sich stellen",
        "REFLEXIVE_VERB",
        [
            {"id": "reflexive", "type": "REFLEXIVE"},
            {"id": "heraus", "type": "LEMMA", "lemma": "heraus"},
        ],
        evidence=4,
    )
    second["head_lemma"] = "stellen"

    ready, review = MODULE.build_batch([first, second], "B")

    assert ready == []
    assert len(review) == 2
    assert all(
        "duplicate_canonical_in_tier" in item["review_reasons"]
        for item in review
    )
