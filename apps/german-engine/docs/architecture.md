# Architecture

## Boundary
The engine identifies German learner-relevant multiword units. UI, subtitle capture and translation-provider integration live outside the core.

## Pipeline
1. **NLP adapter**: sentence/token boundaries, lemma, POS, morphology, dependency graph.
2. **Normalization**: surface inflection is discarded for matching; pronominal adverbs map to their preposition; separable-verb lemmas are expected from the parser and may later be reinforced by a particle normalizer.
3. **Candidate generation**: index patterns by verbal/adjectival head lemma.
4. **Structural matching**: satisfy typed slots using dependency-local evidence first, bounded clause fallback second.
5. **Resolver**: prefer idioms/fixed constructions, then more specific grammatical patterns; suppress overlapping weaker chunks.
6. **Output**: stable JSON suitable for Android, browser extensions, web readers or APIs.

## Why not literal string matching?
German permits discontinuity and inflection:
- `nimmt ... in Kauf`
- `wurde ... in Kauf genommen`
- `hätte ... in Kauf nehmen müssen`
All share the canonical expression `etwas in Kauf nehmen`.

## Expression families
- idioms / fixed expressions
- reflexive verbs
- verb + governed preposition + case
- reflexive verb + governed preposition
- Nomen-Verb-Verbindungen
- Funktionsverbgefüge
- adjective + preposition
- collocations
- multiword connectors
- fixed grammatical constructions
- pronominal-adverb alternations

## Confidence
Parser-local structural evidence scores above clause fallback. Confidence is evidence metadata, not a claim of semantic certainty.

## AI boundary
An optional future contextual resolver may propose unknown expressions or disambiguate senses. Proposals must be marked as candidates and never mutate the curated lexicon automatically.

## Known v0.1 boundary
The core architecture is designed for broad German variation, but lexical coverage is intentionally seed-sized. Real-text regression cycles will expand patterns and reveal parser-specific normalization needs.
