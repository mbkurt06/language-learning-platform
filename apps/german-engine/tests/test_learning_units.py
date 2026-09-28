from german_language_engine.learning_units import LearningUnitResolver
from german_language_engine.models import ExpressionMatch, ExpressionType, LexicalForm, Token, TokenMeaning

def test_expression_suppresses_standalone_preposition():
    tokens=[Token(i=0,text="warten",lemma="warten",pos="VERB"),Token(i=1,text="auf",lemma="auf",pos="ADP")]
    expr=ExpressionMatch(pattern_id="verb.warten_auf",canonical="warten auf + Akk.",type=ExpressionType.VERB_PREPOSITION,meaning_tr=["birini beklemek"],token_indices=[0,1],surface="warten auf",confidence=1.0,rank=100)
    meanings=[TokenMeaning(token_index=0,lemma="warten",contextual_meaning_tr="beklemek"),TokenMeaning(token_index=1,lemma="auf",contextual_meaning_tr="üzerine")]
    units=LearningUnitResolver().resolve(tokens,[expr],meanings)
    assert [unit.canonical for unit in units]==["warten auf + Akk."]

def test_noun_has_article_and_plural():
    token=Token(i=0,text="Bienen",lemma="Biene",pos="NOUN")
    meaning=TokenMeaning(token_index=0,lemma="Biene",contextual_meaning_tr="arı",lexical_form=LexicalForm(article="die",singular="Biene",plural="Bienen"))
    unit=LearningUnitResolver().resolve([token],[],[meaning])[0]
    assert unit.canonical=="die Biene, Pl. Bienen"

def test_same_lemma_different_senses_have_different_ids():
    resolver=LearningUnitResolver()
    token=Token(i=0,text="abnehmen",lemma="abnehmen",pos="VERB")
    a=resolver.resolve([token],[],[TokenMeaning(token_index=0,lemma="abnehmen",contextual_meaning_tr="kilo vermek")])[0]
    b=resolver.resolve([token],[],[TokenMeaning(token_index=0,lemma="abnehmen",contextual_meaning_tr="azalmak")])[0]
    assert a.id!=b.id
