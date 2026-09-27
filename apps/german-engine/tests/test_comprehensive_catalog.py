from german_language_engine.lexicon import ExpressionLexicon
from german_language_engine.matcher import StructuralMatcher
from german_language_engine.models import ExpressionType, Token


LEX = ExpressionLexicon.bundled()
MATCHER = StructuralMatcher()


def t(i, text, lemma, pos="X", dep="", head=None, morph=None):
    return Token(i=i, text=text, lemma=lemma, pos=pos, dep=dep, head=head, morph=morph or {})


def pattern(pid):
    return next(p for p in LEX.patterns if p.id == pid)


def test_modular_catalog_loads_all_expression_families():
    assert len(LEX.patterns) >= 100
    types = {p.type for p in LEX.patterns}
    assert ExpressionType.VERB_PREPOSITION in types
    assert ExpressionType.REFLEXIVE_VERB_PREPOSITION in types
    assert ExpressionType.NOUN_PREPOSITION in types
    assert ExpressionType.ADJECTIVE_PREPOSITION in types
    assert ExpressionType.FUNCTION_VERB in types
    assert ExpressionType.COPULAR_CONSTRUCTION in types


def test_auf_der_suche_nach_sein_matches_complete_construction():
    toks = [
        t(0, "ihr", "ihr", "PRON", "sb", 6),
        t(1, "auf", "auf", "ADP", "mo", 3),
        t(2, "der", "der", "DET", "nk", 3, {"Case": ["Dat"]}),
        t(3, "Suche", "Suche", "NOUN", "pd", 6, {"Case": ["Dat"]}),
        t(4, "nach", "nach", "ADP", "mo", 3),
        t(5, "Tutoren", "Tutor", "NOUN", "nk", 4, {"Case": ["Dat"]}),
        t(6, "seid", "sein", "AUX", "ROOT", None),
    ]
    matches = MATCHER.match(toks, pattern("fixed.auf_der_suche_nach_sein"))
    assert matches
    match = matches[0]
    assert {1, 3, 4, 6}.issubset(set(match.token_indices))
    assert match.meaning_tr[0] == "birini/bir şeyi arıyor olmak"


def test_noun_preposition_suche_nach_matches_without_copula():
    toks = [
        t(0, "die", "der", "DET", "nk", 1),
        t(1, "Suche", "Suche", "NOUN", "ROOT", None),
        t(2, "nach", "nach", "ADP", "mo", 1),
        t(3, "Arbeit", "Arbeit", "NOUN", "nk", 2, {"Case": ["Dat"]}),
    ]
    matches = MATCHER.match(toks, pattern("np.suche_nach"))
    assert matches
    assert set(matches[0].token_indices) >= {1, 2}


def test_adjective_preposition_zufrieden_mit_matches():
    toks = [
        t(0, "Wir", "wir", "PRON", "sb", 3),
        t(1, "sind", "sein", "AUX", "cop", 3),
        t(2, "mit", "mit", "ADP", "mo", 3),
        t(3, "zufrieden", "zufrieden", "ADJ", "ROOT", None),
        t(4, "dem", "der", "DET", "nk", 5, {"Case": ["Dat"]}),
        t(5, "Ergebnis", "Ergebnis", "NOUN", "nk", 2, {"Case": ["Dat"]}),
    ]
    matches = MATCHER.match(toks, pattern("ap.zufrieden_mit"))
    assert matches
    assert matches[0].canonical == "zufrieden mit jemandem/etwas"


def test_multiple_preposition_reflexive_pattern_is_more_specific():
    toks = [
        t(0, "Ich", "ich", "PRON", "sb", 6),
        t(1, "bedanke", "bedanken", "VERB", "ROOT", None),
        t(2, "mich", "ich", "PRON", "oa", 1, {"Reflex": ["Yes"]}),
        t(3, "bei", "bei", "ADP", "mo", 1),
        t(4, "Ihnen", "Sie", "PRON", "nk", 3, {"Case": ["Dat"]}),
        t(5, "für", "für", "ADP", "mo", 1),
        t(6, "die Hilfe", "Hilfe", "NOUN", "nk", 5, {"Case": ["Acc"]}),
    ]
    matches = MATCHER.match(toks, pattern("rvp.bedanken_bei_fuer"))
    assert matches
    assert {1, 2, 3, 5}.issubset(set(matches[0].token_indices))
