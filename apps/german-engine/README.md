# German Language Engine

Reusable German multi-word-expression and learner-chunk analysis engine.

## Goal
Detect the **largest meaningful learnable unit** before translating individual words. The engine normalizes inflection, separable verbs, reflexives, prepositional complements, pronominal adverbs, voice and word-order variation.

Examples that should resolve to one canonical expression:
- `Ich nehme das in Kauf.`
- `Das wurde in Kauf genommen.`
- `Das kann nicht in Kauf genommen werden.`
→ `etwas in Kauf nehmen`

## Architecture
```
text -> NLP adapter -> normalized tokens/dependencies
     -> candidate generation
     -> structural expression matching
     -> overlap/ambiguity resolution
     -> learner-oriented analysis
```

The expression lexicon is structural data, not a list of literal strings.

## UX contract: Context first, dictionary second
When a learner hovers a token, the engine returns its connected expression(s) first, the meaning in the current sentence and a compact grammar hint next, and standalone dictionary meanings last. Nested useful analyses are preserved and ranked rather than deleted. See `docs/hover-contract.md`.

## Principles
1. Match lemmas, not inflected surface forms.
2. Prefer dependency structure over adjacency.
3. Rank the most informative/high-specificity expression first while preserving useful nested analyses.
4. Treat reflexive pronouns and governed prepositions as slots.
5. Normalize pronominal adverbs (darauf/davon/damit...) to governed prepositions.
6. Allow active/passive, tense, mood, modal and clause-order variation.
7. Keep deterministic linguistic analysis separate from optional AI disambiguation.
8. Never silently promote AI guesses into the curated lexicon.

## Setup
```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[nlp,dev]"
python -m spacy download de_core_news_md
pytest
```

## CLI
```bash
gle analyze "Darauf müssen wir Rücksicht nehmen."
```

## Status
v0.1 establishes the reusable engine contract, spaCy adapter, structural matcher, resolver, seed lexicon and regression tests. Real-text evaluation will drive subsequent lexicon/rule expansion.

See `docs/architecture.md` and `docs/expression-schema.md`.
