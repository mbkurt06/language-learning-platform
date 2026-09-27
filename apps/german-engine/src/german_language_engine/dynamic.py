from __future__ import annotations

from collections.abc import Callable

from .models import ExpressionMatch, ExpressionPattern, ExpressionType, Slot, SlotType, Token


PARTICLE_DEPS = {"svp", "prt"}
PARTICLE_TAGS = {"PTKVZ"}
RELATIVE_TAGS = {"PRELS", "PRELAT"}

RELATIVE_FALLBACK = {
    "denen": ("Dat", "Plur"),
    "den": ("Acc", "Plur"),
    "dem": ("Dat", "Sing"),
    "dessen": ("Gen", "Sing"),
    "deren": ("Gen", None),
}

PREP_RELATIVE_TR = {
    "mit": {"Sing": "onunla / ... ki onunla", "Plur": "onlarla / ... ki onlarla"},
    "bei": {"Sing": "onun yanında / ... ki onun yanında", "Plur": "onların yanında / ... ki onların yanında"},
    "von": {"Sing": "ondan / ... ki ondan", "Plur": "onlardan / ... ki onlardan"},
    "zu": {"Sing": "ona / ... ki ona", "Plur": "onlara / ... ki onlara"},
    "für": {"Sing": "onun için / ... ki onun için", "Plur": "onlar için / ... ki onlar için"},
    "über": {"Sing": "onun hakkında / ... ki onun hakkında", "Plur": "onlar hakkında / ... ki onlar hakkında"},
    "gegen": {"Sing": "ona karşı / ... ki ona karşı", "Plur": "onlara karşı / ... ki onlara karşı"},
    "ohne": {"Sing": "onsuz / ... ki onsuz", "Plur": "onlarsız / ... ki onlarsız"},
    "durch": {"Sing": "onun aracılığıyla / ... ki onun aracılığıyla", "Plur": "onların aracılığıyla / ... ki onların aracılığıyla"},
    "nach": {"Sing": "ondan sonra / ona göre (bağlama göre)", "Plur": "onlardan sonra / onlara göre (bağlama göre)"},
    "auf": {"Sing": "ona / onun üzerine (bağlama göre)", "Plur": "onlara / onların üzerine (bağlama göre)"},
    "an": {"Sing": "ona / onun üzerinde (bağlama göre)", "Plur": "onlara / onların üzerinde (bağlama göre)"},
    "um": {"Sing": "onun etrafında / onunla ilgili (bağlama göre)", "Plur": "onların etrafında / onlarla ilgili (bağlama göre)"},
}


class DynamicExpressionDetector:
    def detect(
        self,
        tokens: list[Token],
        lexical_meanings: Callable[[str, str], list[str]],
    ) -> tuple[list[ExpressionMatch], dict[str, ExpressionPattern]]:
        matches: list[ExpressionMatch] = []
        patterns: dict[str, ExpressionPattern] = {}

        particle_matches, particle_patterns = self._particle_verbs(tokens, lexical_meanings)
        matches.extend(particle_matches)
        patterns.update(particle_patterns)

        relative_matches, relative_patterns = self._preposition_relative_pronouns(tokens)
        matches.extend(relative_matches)
        patterns.update(relative_patterns)

        return matches, patterns

    def _particle_verbs(
        self,
        tokens: list[Token],
        lexical_meanings: Callable[[str, str], list[str]],
    ) -> tuple[list[ExpressionMatch], dict[str, ExpressionPattern]]:
        by_i = {token.i: token for token in tokens}
        matches: list[ExpressionMatch] = []
        patterns: dict[str, ExpressionPattern] = {}

        for particle in tokens:
            if particle.dep not in PARTICLE_DEPS and particle.tag not in PARTICLE_TAGS:
                continue
            if particle.head is None:
                continue

            head = by_i.get(particle.head)
            if not head or head.pos not in {"VERB", "AUX"}:
                continue

            prefix = particle.lemma.lower() if particle.lemma else particle.text.lower()
            base = head.lemma.lower()
            infinitive = base if base.startswith(prefix) else prefix + base
            meanings = lexical_meanings(infinitive, "VERB")
            if not meanings:
                continue

            pattern_id = f"dynamic.particle.{infinitive}"
            pattern = ExpressionPattern(
                id=pattern_id,
                canonical=infinitive,
                type=ExpressionType.PARTICLE_VERB,
                head_lemma=head.lemma,
                slots=[Slot(id="particle", type=SlotType.PARTICLE, lemma=prefix)],
                meaning_tr=meanings,
                priority=93,
                grammar_hint=f"trennbar · {head.text} … {particle.text} · Infinitiv: {infinitive}",
            )
            patterns[pattern_id] = pattern
            indices = sorted({head.i, particle.i})
            matches.append(
                ExpressionMatch(
                    pattern_id=pattern_id,
                    canonical=infinitive,
                    type=ExpressionType.PARTICLE_VERB,
                    meaning_tr=meanings,
                    token_indices=indices,
                    surface=" ".join(by_i[i].text for i in indices),
                    confidence=0.99,
                    evidence=["separable-particle dependency"],
                    grammar_hint=pattern.grammar_hint,
                )
            )

        return matches, patterns

    def _preposition_relative_pronouns(
        self,
        tokens: list[Token],
    ) -> tuple[list[ExpressionMatch], dict[str, ExpressionPattern]]:
        matches: list[ExpressionMatch] = []
        patterns: dict[str, ExpressionPattern] = {}

        for index, pronoun in enumerate(tokens):
            is_relative = (
                pronoun.tag in RELATIVE_TAGS
                or "Rel" in pronoun.morph.get("PronType", [])
                or pronoun.text.lower() in {"denen", "dessen", "deren"}
            )
            if not is_relative:
                continue

            prep = None
            for candidate in reversed(tokens[max(0, index - 2):index]):
                if candidate.pos == "ADP":
                    prep = candidate
                    break
            if prep is None:
                continue

            case = (pronoun.morph.get("Case") or [None])[0]
            number = (pronoun.morph.get("Number") or [None])[0]
            fallback_case, fallback_number = RELATIVE_FALLBACK.get(
                pronoun.text.lower(), (None, None)
            )
            case = case or fallback_case
            number = number or fallback_number

            prep_key = prep.lemma.lower() if prep.lemma else prep.text.lower()
            choices = PREP_RELATIVE_TR.get(prep_key, {})
            meaning = choices.get(number) or choices.get("Plur") or "edatlı ilgi zamiri"

            grammar_bits = ["Relativpronomen"]
            if case:
                grammar_bits.append(f"{prep.text} + {case}.")
            else:
                grammar_bits.append(prep.text)
            if number:
                grammar_bits.append("Plural" if number == "Plur" else "Singular")
            grammar_bits.append(f"{pronoun.text} önceki isim grubuna gönderme yapar")
            grammar_hint = " · ".join(grammar_bits)

            canonical = f"{prep.text} {pronoun.text}"
            pattern_id = f"dynamic.relative.{prep_key}.{pronoun.text.lower()}"
            pattern = ExpressionPattern(
                id=pattern_id,
                canonical=canonical,
                type=ExpressionType.GRAMMAR_CONSTRUCTION,
                head_lemma=pronoun.lemma,
                slots=[Slot(id="prep", type=SlotType.PREPOSITION, prep=prep_key)],
                meaning_tr=[meaning],
                priority=89,
                grammar_hint=grammar_hint,
            )
            patterns[pattern_id] = pattern
            matches.append(
                ExpressionMatch(
                    pattern_id=pattern_id,
                    canonical=canonical,
                    type=ExpressionType.GRAMMAR_CONSTRUCTION,
                    meaning_tr=[meaning],
                    token_indices=sorted({prep.i, pronoun.i}),
                    surface=f"{prep.text} {pronoun.text}",
                    confidence=0.99,
                    evidence=["preposition + relative-pronoun morphology"],
                    grammar_hint=grammar_hint,
                )
            )

        return matches, patterns
