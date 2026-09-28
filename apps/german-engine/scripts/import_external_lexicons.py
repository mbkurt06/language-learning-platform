#!/usr/bin/env python3
"""Import external German MWE resources into a reviewable normalized candidate set.

This tool intentionally does NOT write directly into the runtime lexicon. External
resources differ in scope, annotation and licensing, and most do not contain Turkish
meanings. The generated YAML is therefore a review queue. Approved entries can later
be promoted into src/german_language_engine/data/*.yml with curated Turkish meanings.

Supported inputs:
  * PARSEME German .cupt files
  * VerbframesDE verbframes.json

Examples:
  python scripts/import_external_lexicons.py \
    --parseme path/to/DE/train.cupt path/to/DE/dev.cupt path/to/DE/test.cupt \
    --verbframes path/to/verbframes.json \
    --output build/external_lexicon_candidates.yml \
    --report build/external_lexicon_report.json
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter, defaultdict
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any

import yaml


PARSEME_TYPE_MAP = {
    "VID": "IDIOM",
    "IRV": "REFLEXIVE_VERB",
    "LVC.full": "FUNCTION_VERB",
    "LVC.cause": "FUNCTION_VERB",
    "VPC.full": "PARTICLE_VERB",
    "VPC.semi": "PARTICLE_VERB",
    "IAV": "VERB_PREPOSITION",
    "MVC": "FIXED_CONSTRUCTION",
    "LS.ICV": "FIXED_CONSTRUCTION",
}

REFLEXIVE_LEMMAS = {"sich", "mich", "mir", "dich", "dir", "uns", "euch"}
PREPOSITION_UPOS = {"ADP"}
VERB_UPOS = {"VERB", "AUX"}


@dataclass
class Candidate:
    id: str
    canonical: str
    type: str
    head_lemma: str
    slots: list[dict[str, Any]] = field(default_factory=list)
    meaning_tr: list[str] = field(default_factory=list)
    priority: int = 50
    source: list[str] = field(default_factory=list)
    source_category: list[str] = field(default_factory=list)
    evidence_count: int = 1
    status: str = "needs_review"
    notes: str | None = None

    def runtime_pattern(self) -> dict[str, Any]:
        """Return only fields accepted by ExpressionPattern."""
        return {
            "id": self.id,
            "canonical": self.canonical,
            "type": self.type,
            "head_lemma": self.head_lemma,
            "slots": self.slots,
            "meaning_tr": self.meaning_tr,
            "priority": self.priority,
            "notes": self.notes,
        }


def slug(text: str) -> str:
    folded = (
        text.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue")
        .replace("Ä", "Ae").replace("Ö", "Oe").replace("Ü", "Ue")
        .replace("ß", "ss")
    )
    folded = re.sub(r"[^a-zA-Z0-9]+", "_", folded).strip("_").lower()
    return folded[:60] or "expression"


def stable_id(prefix: str, canonical: str, category: str) -> str:
    digest = hashlib.sha1(f"{category}|{canonical}".encode()).hexdigest()[:8]
    return f"ext.{prefix}.{slug(canonical)}.{digest}"


def parse_feats(raw: str) -> dict[str, str]:
    if not raw or raw == "_":
        return {}
    result = {}
    for part in raw.split("|"):
        if "=" in part:
            key, value = part.split("=", 1)
            result[key] = value
    return result


def clean_lemma(token: dict[str, Any]) -> str:
    """Return a stable learner-facing lemma from noisy corpus annotations."""
    lemma = str(token.get("lemma") or token.get("form") or "").strip()
    form = str(token.get("form") or "").strip()
    if not lemma or lemma == "_":
        return form

    # Some German corpora expose morphological alternatives like "er|es|sie".
    # Those are not usable canonical lexicon forms. Prefer the actual surface
    # token unless the construction itself tells us the normalized form.
    if "|" in lemma:
        return form
    return lemma


VID_CANONICAL_RULES = {
    ("geben", "es"): ("es gibt", "FIXED_CONSTRUCTION"),
    ("es", "geben"): ("es gibt", "FIXED_CONSTRUCTION"),
    ("heißen", "es"): ("es heißt", "FIXED_CONSTRUCTION"),
    ("es", "heißen"): ("es heißt", "FIXED_CONSTRUCTION"),
    # PARSEME lemmatizes demonstrative "das" as "der" in these VID examples.
    ("heißen", "der"): ("das heißt", "FIXED_CONSTRUCTION"),
    ("der", "heißen"): ("das heißt", "FIXED_CONSTRUCTION"),
    ("kommen", "es"): ("es kommt zu etwas", "FIXED_CONSTRUCTION"),
    ("es", "kommen"): ("es kommt zu etwas", "FIXED_CONSTRUCTION"),
    ("gelten", "es"): ("es gilt, etwas zu tun", "FIXED_CONSTRUCTION"),
    ("es", "gelten"): ("es gilt, etwas zu tun", "FIXED_CONSTRUCTION"),
    ("handeln", "es", "sich"): ("es handelt sich", "FIXED_CONSTRUCTION"),
    ("es", "handeln", "sich"): ("es handelt sich", "FIXED_CONSTRUCTION"),
    ("gehen", "davon", "aus"): ("davon ausgehen", "FIXED_CONSTRUCTION"),
    ("stehen", "fest"): ("feststehen", "PARTICLE_VERB"),
    ("stehen", "bereit"): ("bereitstehen", "PARTICLE_VERB"),
    ("stellen", "fest"): ("feststellen", "PARTICLE_VERB"),
    ("haben", "zu", "tun"): ("mit etwas zu tun haben", "IDIOM"),
    ("stehen", "zur", "verfügung"): ("zur Verfügung stehen", "FUNCTION_VERB"),
    ("verlieren", "gehen"): ("verloren gehen", "FIXED_CONSTRUCTION"),
}


def canonicalize_parseme(category: str, members: list[dict[str, Any]]) -> tuple[str, str, str | None]:
    """Create a learner-facing canonical candidate and optional type override.

    PARSEME annotation is corpus-oriented. Its token lemmas are not automatically
    a dictionary entry, especially for reflexives, separable verbs and VID entries.
    """
    verb_tokens = [item for item in members if item["upos"] in VERB_UPOS]
    if not verb_tokens:
        return "", "", None
    head = verb_tokens[0]
    head_lemma = clean_lemma(head).lower()

    if category == "IRV":
        return f"sich {head_lemma}", head_lemma, None

    if category in {"VPC.full", "VPC.semi"}:
        non_verbs = [item for item in members if item["id"] != head["id"]]
        particles = [
            clean_lemma(item).lower()
            for item in non_verbs
            if item["upos"] in {"ADP", "ADV", "PART"} or item.get("deprel") in {"compound:prt", "svp"}
        ]
        if particles:
            # German separable verbs are written as one infinitive in dictionary form:
            # statt + finden -> stattfinden, mit + teilen -> mitteilen.
            return "".join(particles) + head_lemma, head_lemma, None

        # Some PARSEME/German tag combinations do not mark a separable prefix
        # with a particle-like UPOS/deprel even though the MWE category is VPC.
        # Keep a tiny explicit fallback for observed high-confidence cases.
        raw_non_verbs = tuple(clean_lemma(item).lower() for item in non_verbs)
        if head_lemma == "räumen" and raw_non_verbs == ("ein",):
            return "einräumen", head_lemma, None

    parts: list[str] = []
    for item in members:
        lemma = clean_lemma(item)
        low = lemma.lower()
        if low in REFLEXIVE_LEMMAS:
            lemma = "sich"
        parts.append(lemma)

    if category == "VID":
        normalized_key = tuple(part.casefold() for part in parts)

        # Casefold the rule keys too. This matters in German because e.g.
        # "heißen".casefold() == "heissen".
        normalized_rules = {
            tuple(part.casefold() for part in rule_key): rule
            for rule_key, rule in VID_CANONICAL_RULES.items()
        }

        rule = normalized_rules.get(normalized_key)
        if rule:
            canonical, type_override = rule
            return canonical, head_lemma, type_override

        # VID token order can vary around finite verbs/particles. Try a
        # small order-insensitive lookup, but only for explicit high-confidence
        # rules to avoid broad heuristic rewrites.
        member_multiset = Counter(normalized_key)
        for rule_key, rule in normalized_rules.items():
            if Counter(rule_key) == member_multiset:
                canonical, type_override = rule
                return canonical, head_lemma, type_override

    return " ".join(parts), head_lemma, None


def parse_parseme_files(paths: list[Path], min_count: int) -> list[Candidate]:
    observations: dict[tuple[str, tuple[str, ...], str], list[dict[str, Any]]] = defaultdict(list)

    for path in paths:
        tokens: list[dict[str, Any]] = []

        def flush() -> None:
            nonlocal tokens
            if not tokens:
                return
            mwes: dict[str, dict[str, Any]] = {}
            for token in tokens:
                annotation = token["mwe"]
                if not annotation or annotation == "*":
                    continue
                for chunk in annotation.split(";"):
                    chunk = chunk.strip()
                    if not chunk or chunk == "*":
                        continue
                    if ":" in chunk:
                        mwe_id, category = chunk.split(":", 1)
                    else:
                        mwe_id, category = chunk, ""
                    entry = mwes.setdefault(mwe_id, {"category": category, "tokens": []})
                    if category:
                        entry["category"] = category
                    entry["tokens"].append(token)

            for entry in mwes.values():
                members = sorted(entry["tokens"], key=lambda item: item["id"])
                category = entry["category"]
                lemmas = tuple(clean_lemma(item).lower() for item in members)
                if len(lemmas) < 2:
                    continue
                key = (category, lemmas, str(path))
                observations[key].append({"tokens": members})
            tokens = []

        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.rstrip("\n")
            if not line:
                flush()
                continue
            if line.startswith("#"):
                continue
            cols = line.split("\t")
            if len(cols) < 11 or "-" in cols[0] or "." in cols[0]:
                continue
            try:
                token_id = int(cols[0])
            except ValueError:
                continue
            tokens.append({
                "id": token_id,
                "form": cols[1],
                "lemma": cols[2] if cols[2] != "_" else cols[1],
                "upos": cols[3],
                "feats": parse_feats(cols[5]),
                "head": cols[6],
                "deprel": cols[7],
                "mwe": cols[10],
            })
        flush()

    merged: dict[tuple[str, tuple[str, ...]], list[dict[str, Any]]] = defaultdict(list)
    sources: dict[tuple[str, tuple[str, ...]], set[str]] = defaultdict(set)
    for (category, lemmas, source), items in observations.items():
        merged[(category, lemmas)].extend(items)
        sources[(category, lemmas)].add(source)

    candidates: list[Candidate] = []
    for (category, lemmas), items in merged.items():
        if len(items) < min_count:
            continue
        representative = items[0]["tokens"]
        canonical, head_lemma, type_override = canonicalize_parseme(category, representative)
        if not canonical or not head_lemma:
            continue
        verb_tokens = [item for item in representative if item["upos"] in VERB_UPOS]
        head_token = verb_tokens[0]

        slots: list[dict[str, Any]] = []
        slot_seq = 0
        for item in representative:
            lemma = clean_lemma(item).lower()
            if item["id"] == head_token["id"]:
                continue
            slot_seq += 1
            if lemma in REFLEXIVE_LEMMAS:
                slots.append({"id": f"reflexive_{slot_seq}", "type": "REFLEXIVE"})
            elif item["upos"] in PREPOSITION_UPOS:
                case = item["feats"].get("Case")
                slot = {"id": f"prep_{slot_seq}", "type": "PREPOSITION", "prep": lemma}
                if case:
                    slot["case"] = [case]
                slots.append(slot)
            else:
                # For IRV, the reflexive pronoun is structural rather than a lexical lemma.
                slots.append({"id": f"lemma_{slot_seq}", "type": "LEMMA", "lemma": clean_lemma(item)})

        mapped_type = type_override or PARSEME_TYPE_MAP.get(category, "FIXED_CONSTRUCTION")
        candidates.append(Candidate(
            id=stable_id("parseme", canonical, category),
            canonical=canonical,
            type=mapped_type,
            head_lemma=head_lemma,
            slots=slots,
            priority=min(92, 60 + min(len(items), 32)),
            source=sorted(sources[(category, lemmas)]),
            source_category=[category] if category else [],
            evidence_count=len(items),
            notes="Imported from PARSEME; canonical form and slot mapping require review.",
        ))
    return candidates


def _fixed_verbframe_slots(frame: dict[str, Any]) -> tuple[list[dict[str, Any]], list[str]]:
    slots: list[dict[str, Any]] = []
    canonical_parts: list[str] = []
    ignored = {"vfin", "optional", "mandatory", "forbidden", "synsets", "synsetIds"}
    seq = 0

    for key, value in frame.items():
        if key in ignored:
            continue
        seq += 1
        if key in {"AR", "DR"}:
            slots.append({"id": f"reflexive_{seq}", "type": "REFLEXIVE"})
            canonical_parts.append("sich")
            continue

        if "+" in key:
            # VerbframesDE can encode alternatives such as
            # "von+D/bei+D" or "mit+D/per+D/mittels+G". For the review queue
            # preserve the first governed preposition as the structural slot and
            # record the remaining alternatives in notes during review rather than
            # creating an invalid compound preposition.
            first_variant = key.split("/", 1)[0]
            prep, raw_case = first_variant.rsplit("+", 1)
            case_map = {"A": "Acc", "D": "Dat", "G": "Gen", "N": "Nom"}
            slot: dict[str, Any] = {"id": f"prep_{seq}", "type": "PREPOSITION", "prep": prep}
            if raw_case in case_map:
                slot["case"] = [case_map[raw_case]]
            slots.append(slot)
            canonical_parts.append(prep)

            if isinstance(value, str) and value:
                slots.append({"id": f"lemma_{seq}", "type": "LEMMA", "lemma": value})
                canonical_parts.append(value)
            elif isinstance(value, dict) and value.get("head"):
                slots.append({"id": f"lemma_{seq}", "type": "LEMMA", "lemma": value["head"]})
                canonical_parts.append(str(value["head"]))
            continue

        if isinstance(value, str) and value:
            slots.append({"id": f"lemma_{seq}", "type": "LEMMA", "lemma": value})
            canonical_parts.append(value)
        elif isinstance(value, dict) and value.get("head"):
            slots.append({"id": f"lemma_{seq}", "type": "LEMMA", "lemma": value["head"]})
            canonical_parts.append(str(value["head"]))

    return slots, canonical_parts


def parse_verbframes(path: Path) -> list[Candidate]:
    data = json.loads(path.read_text(encoding="utf-8"))
    frames = data if isinstance(data, list) else data.get("verbframes", data.get("frames", []))
    candidates: list[Candidate] = []

    for frame in frames:
        if not isinstance(frame, dict):
            continue
        head = frame.get("vfin")
        if not isinstance(head, str) or not head:
            continue
        slots, fixed_parts = _fixed_verbframe_slots(frame)
        # Plain syntactic valency frames are useful for parsing but are not lexical
        # expressions. Only import frames containing at least one fixed lexical slot.
        if not fixed_parts:
            continue

        canonical_parts = [*fixed_parts, head]
        canonical = " ".join(canonical_parts)
        reflexive = any(slot["type"] == "REFLEXIVE" for slot in slots)
        has_prep = any(slot["type"] == "PREPOSITION" for slot in slots)
        if reflexive and has_prep:
            expr_type = "REFLEXIVE_VERB_PREPOSITION"
        elif reflexive:
            expr_type = "REFLEXIVE_VERB"
        elif has_prep:
            expr_type = "VERB_PREPOSITION"
        else:
            expr_type = "FIXED_CONSTRUCTION"

        candidates.append(Candidate(
            id=stable_id("verbframes", canonical, expr_type),
            canonical=canonical,
            type=expr_type,
            head_lemma=head.lower(),
            slots=slots,
            priority=65,
            source=[str(path)],
            source_category=["VerbframesDE"],
            evidence_count=1,
            notes="Imported from VerbframesDE; canonical ordering/type and Turkish meaning require review.",
        ))
    return candidates


def deduplicate(candidates: list[Candidate]) -> list[Candidate]:
    merged: dict[tuple[str, str, tuple[tuple[str, str], ...]], Candidate] = {}
    for item in candidates:
        slot_sig = tuple(
            sorted(
                (
                    str(slot.get("type", "")),
                    str(slot.get("lemma") or slot.get("prep") or ""),
                )
                for slot in item.slots
            )
        )
        key = (item.head_lemma.casefold(), item.type, slot_sig)
        current = merged.get(key)
        if current is None:
            merged[key] = item
            continue
        current.evidence_count += item.evidence_count
        current.source = sorted(set(current.source) | set(item.source))
        current.source_category = sorted(set(current.source_category) | set(item.source_category))
        current.priority = max(current.priority, item.priority)
    return sorted(
        merged.values(),
        key=lambda item: (-item.evidence_count, item.type, item.canonical.casefold()),
    )


def existing_signatures(data_dir: Path) -> set[tuple[str, str, tuple[tuple[str, str], ...]]]:
    signatures = set()
    for path in sorted(data_dir.glob("*.yml")):
        for item in yaml.safe_load(path.read_text(encoding="utf-8")) or []:
            slots = item.get("slots", [])
            slot_sig = tuple(
                sorted(
                    (
                        str(slot.get("type", "")),
                        str(slot.get("lemma") or slot.get("prep") or ""),
                    )
                    for slot in slots
                )
            )
            signatures.add((str(item.get("head_lemma", "")).casefold(), str(item.get("type", "")), slot_sig))
    return signatures


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--parseme", nargs="*", type=Path, default=[])
    parser.add_argument("--verbframes", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--min-parseme-count", type=int, default=2)
    parser.add_argument(
        "--existing-data-dir",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "src/german_language_engine/data",
    )
    args = parser.parse_args()

    candidates: list[Candidate] = []
    if args.parseme:
        candidates.extend(parse_parseme_files(args.parseme, args.min_parseme_count))
    if args.verbframes:
        candidates.extend(parse_verbframes(args.verbframes))

    candidates = deduplicate(candidates)
    existing = existing_signatures(args.existing_data_dir)
    new_candidates = []
    duplicates = 0
    for item in candidates:
        slot_sig = tuple(
            sorted(
                (
                    str(slot.get("type", "")),
                    str(slot.get("lemma") or slot.get("prep") or ""),
                )
                for slot in item.slots
            )
        )
        sig = (item.head_lemma.casefold(), item.type, slot_sig)
        if sig in existing:
            duplicates += 1
            continue
        new_candidates.append(item)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    payload = [asdict(item) for item in new_candidates]
    args.output.write_text(
        yaml.safe_dump(payload, allow_unicode=True, sort_keys=False, width=110),
        encoding="utf-8",
    )

    report = {
        "candidate_count_before_existing_filter": len(candidates),
        "existing_duplicates_skipped": duplicates,
        "candidate_count": len(new_candidates),
        "by_type": dict(Counter(item.type for item in new_candidates)),
        "by_source_category": dict(
            Counter(category for item in new_candidates for category in item.source_category)
        ),
        "requires_review": True,
        "promotion_rule": "Do not bundle until canonical form, type, slots, licensing and Turkish meaning are reviewed.",
    }
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
