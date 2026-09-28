from german_language_engine.matcher import StructuralMatcher
from german_language_engine.models import ExpressionPattern, Token


def particle_pattern() -> ExpressionPattern:
    return ExpressionPattern.model_validate({
        "id": "particle.stattfinden",
        "canonical": "stattfinden",
        "type": "PARTICLE_VERB",
        "head_lemma": "finden",
        "meaning_tr": ["gerçekleşmek"],
        "slots": [
            {"id": "particle", "type": "PARTICLE", "lemma": "statt"},
        ],
    })


def test_particle_verb_matches_separated_surface_form():
    tokens = [
        Token(i=0, text="findet", lemma="finden", pos="VERB", head=None),
        Token(i=1, text="statt", lemma="statt", pos="PART", head=0),
    ]

    matches = StructuralMatcher().match(tokens, particle_pattern())

    assert len(matches) == 1
    assert matches[0].canonical == "stattfinden"
    assert matches[0].token_indices == [0, 1]


def test_particle_verb_matches_joined_lemma_form():
    tokens = [
        Token(i=0, text="stattfindet", lemma="stattfinden", pos="VERB", head=None),
    ]

    matches = StructuralMatcher().match(tokens, particle_pattern())

    assert len(matches) == 1
    assert matches[0].canonical == "stattfinden"
    assert matches[0].token_indices == [0]
    assert "particle incorporated in verb lemma" in matches[0].evidence


def test_fixed_construction_with_particle_matches_joined_lemma_form():
    pattern = ExpressionPattern.model_validate({
        "id": "fixed.davon_ausgehen",
        "canonical": "davon ausgehen",
        "type": "FIXED_CONSTRUCTION",
        "head_lemma": "gehen",
        "meaning_tr": ["bundan yola çıkmak", "bunu varsaymak"],
        "slots": [
            {"id": "davon", "type": "LEMMA", "lemma": "davon"},
            {"id": "aus", "type": "PARTICLE", "lemma": "aus"},
        ],
    })
    tokens = [
        Token(i=0, text="Wir", lemma="wir", pos="PRON", head=2),
        Token(i=1, text="davon", lemma="davon", pos="ADV", head=2),
        Token(i=2, text="ausgehen", lemma="ausgehen", pos="VERB", head=None),
    ]

    matches = StructuralMatcher().match(tokens, pattern)

    assert len(matches) == 1
    assert matches[0].canonical == "davon ausgehen"
    assert matches[0].token_indices == [1, 2]
    assert "particle incorporated in verb lemma" in matches[0].evidence
