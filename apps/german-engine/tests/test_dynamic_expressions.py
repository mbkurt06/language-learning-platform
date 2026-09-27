from german_language_engine.dynamic import DynamicExpressionDetector
from german_language_engine.meaning import MeaningResolver
from german_language_engine.models import ExpressionType, Token


DETECTOR = DynamicExpressionDetector()
MEANINGS = MeaningResolver()


def test_separable_verb_aussehen_is_reconstructed_from_particle_dependency():
    tokens = [
        Token(i=0, text="Morgen", lemma="Morgen", pos="NOUN", dep="sb", head=1),
        Token(i=1, text="sieht", lemma="sehen", pos="VERB", dep="ROOT", head=None),
        Token(i=2, text="so", lemma="so", pos="ADV", dep="mo", head=1),
        Token(i=3, text="aus", lemma="aus", pos="PART", tag="PTKVZ", dep="svp", head=1),
    ]

    matches, patterns = DETECTOR.detect(tokens, MEANINGS.lexical_meanings)

    match = next(item for item in matches if item.canonical == "aussehen")
    assert match.type == ExpressionType.PARTICLE_VERB
    assert set(match.token_indices) == {1, 3}
    assert match.meaning_tr[0] == "görünmek"
    assert "Infinitiv: aussehen" in match.grammar_hint
    assert match.pattern_id in patterns


def test_separable_verb_aufstehen_is_reconstructed_generically():
    tokens = [
        Token(i=0, text="Ich", lemma="ich", pos="PRON", dep="sb", head=1),
        Token(i=1, text="stehe", lemma="stehen", pos="VERB", dep="ROOT", head=None),
        Token(i=2, text="auf", lemma="auf", pos="PART", tag="PTKVZ", dep="svp", head=1),
    ]

    matches, _ = DETECTOR.detect(tokens, MEANINGS.lexical_meanings)

    match = next(item for item in matches if item.canonical == "aufstehen")
    assert set(match.token_indices) == {1, 2}
    assert "ayağa kalkmak" in match.meaning_tr


def test_mit_denen_is_detected_as_preposition_relative_pronoun_group():
    tokens = [
        Token(i=0, text="mit", lemma="mit", pos="ADP", dep="mo", head=3),
        Token(
            i=1,
            text="denen",
            lemma="der",
            pos="PRON",
            tag="PRELS",
            dep="nk",
            head=0,
            morph={"Case": ["Dat"], "Number": ["Plur"], "PronType": ["Rel"]},
        ),
        Token(i=2, text="ihr", lemma="ihr", pos="PRON", dep="sb", head=3),
        Token(i=3, text="verbessern", lemma="verbessern", pos="VERB", dep="ROOT", head=None),
    ]

    matches, _ = DETECTOR.detect(tokens, MEANINGS.lexical_meanings)

    match = next(item for item in matches if item.canonical == "mit denen")
    assert set(match.token_indices) == {0, 1}
    assert match.meaning_tr[0] == "onlarla / ... ki onlarla"
    assert "mit + Dat." in match.grammar_hint
    assert "Plural" in match.grammar_hint
