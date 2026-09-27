from german_language_engine.hover import HoverBuilder
from german_language_engine.meaning import MeaningResolver
from german_language_engine.models import ExpressionMatch, ExpressionType, Token
from german_language_engine.resolver import MatchResolver


def test_hover_is_context_first_dictionary_second():
    tokens = [
        Token(i=0, text="Rücksicht", lemma="Rücksicht", pos="NOUN"),
        Token(i=1, text="nehmen", lemma="nehmen", pos="VERB"),
    ]
    expression = ExpressionMatch(
        pattern_id="nvv.ruecksicht_nehmen",
        canonical="auf jemanden/etwas Rücksicht nehmen",
        type=ExpressionType.NOMEN_VERB,
        meaning_tr=["birini/bir şeyi dikkate almak"],
        token_indices=[0, 1],
        surface="Rücksicht nehmen",
        confidence=0.95,
        rank=100,
        grammar_hint="auf + Akk.",
    )
    meanings = MeaningResolver().word_meanings(tokens, [expression])
    hover = HoverBuilder(MatchResolver()).build(tokens, [expression], meanings)

    assert hover[0].primary_expressions[0].canonical == "auf jemanden/etwas Rücksicht nehmen"
    assert hover[0].contextual_word_meaning_tr == "birini/bir şeyi dikkate almak"
    assert "dikkat" in hover[0].dictionary_meanings_tr
