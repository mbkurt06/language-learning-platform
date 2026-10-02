from german_language_engine.lexicon import ExpressionLexicon
from german_language_engine.matcher import StructuralMatcher
from german_language_engine.models import Token


EXPECTED_IDS = {
    "promoted.parseme.a.es_gibt",
    "promoted.parseme.a.es_heisst",
    "promoted.parseme.a.stattfinden",
    "promoted.parseme.a.sich_befinden",
    "promoted.parseme.a.es_kommt_zu_etwas",
    "promoted.parseme.a.ausgehen",
    "promoted.parseme.a.mitteilen",
    "promoted.parseme.a.ankuendigen",
    "promoted.parseme.a.davon_ausgehen",
    "promoted.parseme.a.anbieten",
    "promoted.parseme.a.feststehen",
    "promoted.parseme.a.es_handelt_sich_um_etwas",
    "promoted.parseme.a.einraeumen",
    "promoted.parseme.a.feststellen",
    "promoted.parseme.a.teilnehmen",
    "promoted.parseme.a.vorstellen",
}


def test_promoted_parseme_a_batch_is_bundled_with_curated_meanings():
    lexicon = ExpressionLexicon.bundled()
    by_id = {pattern.id: pattern for pattern in lexicon.patterns}

    assert EXPECTED_IDS <= by_id.keys()
    assert all(by_id[pattern_id].meaning_tr for pattern_id in EXPECTED_IDS)


def test_fixed_construction_with_particle_matches_joined_head():
    lexicon = ExpressionLexicon.bundled()
    pattern = next(
        pattern for pattern in lexicon.patterns
        if pattern.id == "promoted.parseme.a.davon_ausgehen"
    )
    tokens = [
        Token(i=0, text="Wir", lemma="wir", pos="PRON", head=1),
        Token(i=1, text="gehen", lemma="ausgehen", pos="VERB", head=None),
        Token(i=2, text="davon", lemma="davon", pos="ADV", head=1),
    ]

    matches = StructuralMatcher().match(tokens, pattern)

    assert len(matches) == 1
    assert matches[0].canonical == "davon ausgehen"
    assert matches[0].token_indices == [1, 2]
