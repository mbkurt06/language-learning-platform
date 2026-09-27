from __future__ import annotations

from .models import ExpressionMatch, ExpressionPattern

TYPE_WEIGHT = {
    "IDIOM": 40,
    "FIXED_CONSTRUCTION": 38,
    "FUNCTION_VERB": 35,
    "REFLEXIVE_VERB_PREPOSITION": 34,
    "NOMEN_VERB": 32,
    "VERB_PREPOSITION": 28,
    "REFLEXIVE_VERB": 25,
    "ADJECTIVE_PREPOSITION": 24,
    "NOUN_PREPOSITION": 24,
    "PARTICLE_VERB": 27,
    "COPULAR_CONSTRUCTION": 31,
    "COLLOCATION": 20,
    "CONNECTOR": 18,
    "GRAMMAR_CONSTRUCTION": 16,
}


class MatchResolver:
    """Ranks matches without deleting pedagogically useful nested analyses."""

    def score(self, match: ExpressionMatch, pattern: ExpressionPattern) -> float:
        return (
            pattern.priority
            + TYPE_WEIGHT.get(match.type.value, 0)
            + len(match.token_indices) * 3
            + match.confidence * 10
        )

    def resolve(
        self, matches: list[ExpressionMatch], patterns: dict[str, ExpressionPattern]
    ) -> list[ExpressionMatch]:
        # Deduplicate exact detections, but preserve overlapping/nested expressions.
        best: dict[tuple[str, tuple[int, ...]], ExpressionMatch] = {}
        for match in matches:
            key = (match.pattern_id, tuple(match.token_indices))
            match.rank = self.score(match, patterns[match.pattern_id])
            current = best.get(key)
            if current is None or match.rank > current.rank:
                best[key] = match
        return sorted(
            best.values(),
            key=lambda match: (min(match.token_indices), -match.rank),
        )

    def for_token(
        self,
        token_index: int,
        matches: list[ExpressionMatch],
        limit: int = 4,
    ) -> list[ExpressionMatch]:
        relevant = [match for match in matches if token_index in match.token_indices]
        return sorted(relevant, key=lambda match: match.rank, reverse=True)[:limit]
