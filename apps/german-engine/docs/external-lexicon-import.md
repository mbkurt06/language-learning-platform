# External German multiword lexicon import

The runtime German Engine deliberately uses a curated lexicon. This keeps false positives low,
but a manually maintained list cannot cover enough German idioms, Nomen-Verb-Verbindungen,
Funktionsverbgefüge, verb-preposition combinations and other multiword expressions.

This import pipeline turns external lexical/corpus resources into a normalized **review queue**.
It does **not** copy external data directly into the production runtime lexicon.

## Sources

### PARSEME German

PARSEME provides manually annotated German verbal multiword expressions in CUPT format.
The importer reads the `PARSEME:MWE` column, aggregates repeated lemma patterns and maps
PARSEME categories into the engine's expression types.

Initial category mapping:

| PARSEME | Engine |
| --- | --- |
| VID | IDIOM |
| IRV | REFLEXIVE_VERB |
| LVC.full / LVC.cause | FUNCTION_VERB |
| VPC.full / VPC.semi | PARTICLE_VERB |
| IAV | VERB_PREPOSITION |
| MVC / LS.ICV | FIXED_CONSTRUCTION |

The importer defaults to requiring at least two corpus observations for a PARSEME candidate.
This threshold can be changed with `--min-parseme-count`.

Upstream:
- PARSEME shared-task data: https://gitlab.com/parseme/sharedtask-data
- German edition 1.2 data live under `1.2/DE/`

Before redistributing any imported material, review the German corpus README and its license.
The repository intentionally does not vendor PARSEME data.

### VerbframesDE

VerbframesDE provides German syntactic verb frames, including frames with fixed lexical slots.
The importer intentionally skips plain valency-only frames and keeps only frames that contain
at least one fixed lexical filling.

Upstream:
- https://github.com/bflowtoolbox/VerbframesDE
- `verbframes.json`

VerbframesDE is MPL-2.0. The resource is especially useful for business/administration German,
but its own README notes that its domain coverage is limited.

## Running the importer

Download or clone the upstream resources outside this repository, then run:

```bash
cd apps/german-engine

python scripts/import_external_lexicons.py \
  --parseme /path/to/sharedtask-data/1.2/DE/train.cupt \
            /path/to/sharedtask-data/1.2/DE/dev.cupt \
            /path/to/sharedtask-data/1.2/DE/test.cupt \
  --verbframes /path/to/VerbframesDE/verbframes.json \
  --output build/external_lexicon_candidates.yml \
  --report build/external_lexicon_report.json
```

The report contains:
- total normalized candidates,
- candidates skipped because an equivalent runtime pattern already exists,
- counts by expression type,
- counts by source category.

## Review queue format

Generated candidates contain runtime-compatible fields plus provenance/review metadata:

```yaml
- id: ext.parseme...
  canonical: ...
  type: IDIOM
  head_lemma: ...
  slots: ...
  meaning_tr: []
  priority: 68
  source:
    - /path/to/train.cupt
  source_category:
    - VID
  evidence_count: 8
  status: needs_review
  notes: Imported from PARSEME; canonical form and slot mapping require review.
```

## Promotion policy

A candidate must not be copied into `src/german_language_engine/data/*.yml` until these
items have been reviewed:

1. **Lexical identity** — this is a genuine reusable German expression, not merely words
   that happened to occur together.
2. **Canonical form** — normalize inflection and placeholders such as
   `jemanden/etwas`, `jemandem/etwas`, `sich`.
3. **Expression type** — choose the most useful learner-facing category.
4. **Structural slots** — verify fixed lemmas, reflexive slot, preposition and case.
5. **Turkish meaning** — add a curated learner-friendly meaning; do not rely blindly on
   isolated machine translation.
6. **Source/license** — confirm that the intended use is compatible with the upstream license.
7. **Duplicate/overlap** — prefer one strong canonical entry over several near-duplicates.

## Why review is required

PARSEME is an annotated corpus, not a ready-made bilingual dictionary. Its surface/lemma
sequences are excellent evidence that a multiword expression exists, but they do not directly
provide our preferred canonical learner form or Turkish meaning.

VerbframesDE is structurally rich, but it also contains many ordinary valency frames. The
importer therefore extracts only frames with fixed lexical material and still marks them for
review.

This separation gives us a scalable path to thousands of candidates without degrading the
runtime matcher with noisy or mistranslated entries.


## Bulk promotion workflow

After generating `build/external_lexicon_candidates.yml`, use the promotion-stage script to
create a structurally clean batch instead of reviewing every entry one by one:

```bash
python scripts/build_promotion_batch.py \
  --input build/external_lexicon_candidates.yml \
  --tier A \
  --output build/promotion_a_ready.yml \
  --review-output build/promotion_a_review.yml \
  --report build/promotion_a_report.json
```

Tier definitions:

- **A**: PARSEME-derived candidates observed at least 10 times.
- **B**: PARSEME-derived candidates observed 3–9 times.
- **C**: remaining PARSEME-derived candidates.
- VerbframesDE candidates are intentionally excluded from automatic PARSEME promotion tiers and
  remain in their own review path.

The promotion stage applies repeatable structural quality gates. For example, particle verbs must
have PARTICLE slots, reflexive verbs must have a REFLEXIVE slot, malformed canonicals are rejected,
and known context-sensitive corpus groupings such as `es gehen` stay in the review queue.

A candidate marked `ready_for_translation` is **not yet a runtime lexicon entry**. It still needs
a curated Turkish learner-facing meaning before its runtime fields are copied into
`src/german_language_engine/data/*.yml`.


## First promoted A-tier batch

The first curated PARSEME A-tier production batch lives in
`src/german_language_engine/data/promoted_parseme_a.yml`.

It contains 16 structurally reviewed German expressions with curated Turkish learner meanings.
The context-sensitive `es gehen` grouping remains outside the runtime lexicon.

Provenance: the candidates were discovered from the German PARSEME shared-task 1.2 corpus and then
normalized and curated by this project. Raw corpus files are not vendored in this repository.
