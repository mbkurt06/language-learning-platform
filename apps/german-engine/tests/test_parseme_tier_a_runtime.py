from german_language_engine.lexicon import ExpressionLexicon


def test_parseme_tier_a_batch_is_promoted_without_runtime_duplicates():
    lexicon = ExpressionLexicon.bundled()
    promoted = [p for p in lexicon.patterns if p.id.startswith("parseme.a.")]

    assert len(promoted) == 15
    assert all(p.meaning_tr for p in promoted)
    assert len({p.id for p in lexicon.patterns}) == len(lexicon.patterns)

    canonicals = [p.canonical for p in promoted]
    assert len(canonicals) == len(set(canonicals))
    assert "es handelt sich um etwas" not in canonicals


def test_existing_specific_patterns_remain_available_alongside_tier_a():
    lexicon = ExpressionLexicon.bundled()
    by_id = {p.id: p for p in lexicon.patterns}

    assert "fixed.es_handelt_sich_um" in by_id
    assert "fixed.ausgehen_davon_dass" in by_id
    assert "parseme.a.davon_ausgehen" in by_id
    assert by_id["fixed.ausgehen_davon_dass"].priority > by_id["parseme.a.davon_ausgehen"].priority
