from german_language_engine.models import ExpressionMatch, ExpressionPattern, ExpressionType
from german_language_engine.resolver import MatchResolver


def p(pid, typ, priority):
    return ExpressionPattern(
        id=pid, canonical=pid, type=typ, head_lemma="x", slots=[], priority=priority
    )


def m(pid, typ, idx):
    return ExpressionMatch(
        pattern_id=pid,
        canonical=pid,
        type=typ,
        meaning_tr=[],
        token_indices=idx,
        surface="",
        confidence=0.9,
    )


def test_nested_useful_expressions_are_preserved_and_ranked():
    patterns = {
        "idiom": p("idiom", ExpressionType.IDIOM, 90),
        "verb": p("verb", ExpressionType.VERB_PREPOSITION, 50),
    }
    out = MatchResolver().resolve(
        [
            m("verb", ExpressionType.VERB_PREPOSITION, [2, 4]),
            m("idiom", ExpressionType.IDIOM, [1, 2, 4]),
        ],
        patterns,
    )
    assert {item.pattern_id for item in out} == {"idiom", "verb"}
    hover = MatchResolver().for_token(2, out)
    assert hover[0].pattern_id == "idiom"
