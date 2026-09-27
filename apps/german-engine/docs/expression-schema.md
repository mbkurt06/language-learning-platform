# Expression schema

A lexicon entry describes a **linguistic pattern**, not a sentence fragment.

```yaml
id: reflexiv.interessieren_fuer
canonical: sich für jemanden/etwas interessieren
type: REFLEXIVE_VERB_PREPOSITION
head_lemma: interessieren
priority: 90
meaning_tr:
  - biriyle/bir şeyle ilgilenmek
slots:
  - id: reflexive
    type: REFLEXIVE
  - id: fuer
    type: PREPOSITION
    prep: für
    case: [Acc]
```

## Slot types
- `LEMMA`: required lexical lemma independent of inflection.
- `REFLEXIVE`: person-varying reflexive pronoun.
- `PREPOSITION`: governed preposition; accepts matching da-/wo- pronominal adverbs.
- `PARTICLE`: separable particle when a parser does not normalize it into the lemma.
- `OBJECT`: typed nominal/pronominal argument with optional case constraint.
- `CLAUSE`: clausal complement.
- `PRONOMINAL_ADVERB`: explicitly requires a da-/wo- form.

## Variation policy
Tense/person/number/mood are normally unrestricted because matching occurs on lemmas. Word order is flexible. Passive is permitted unless an entry forbids it. Case constraints apply to governed complements, not to a literal surface string.

## Lexicon quality
Every new expression should receive:
1. canonical form,
2. structural type,
3. head lemma,
4. required/optional slots,
5. governed case where applicable,
6. learner meaning,
7. at least one positive regression test,
8. a negative/contrastive test when ambiguity is plausible.
