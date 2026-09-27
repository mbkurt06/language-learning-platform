from german_language_engine.lexicon import ExpressionLexicon
from german_language_engine.matcher import StructuralMatcher
from german_language_engine.models import Token

LEX=ExpressionLexicon.bundled()
M=StructuralMatcher()

def t(i,text,lemma,pos="X",dep="",head=None,morph=None):
    return Token(i=i,text=text,lemma=lemma,pos=pos,dep=dep,head=head,morph=morph or {})

def pattern(pid):
    return next(p for p in LEX.patterns if p.id==pid)

def test_in_kauf_genommen_passive():
    toks=[
      t(0,"Das","das","PRON","sb",4), t(1,"wurde","werden","AUX","aux",4),
      t(2,"in","in","ADP","mo",3), t(3,"Kauf","Kauf","NOUN","nk",4),
      t(4,"genommen","nehmen","VERB","ROOT",None)
    ]
    m=M.match(toks,pattern("idiom.in_kauf_nehmen"))
    assert m and m[0].canonical=="etwas in Kauf nehmen"

def test_reflexive_pronominal_adverb():
    toks=[
      t(0,"Dafür","dafür","ADV","op",3), t(1,"interessiere","interessieren","VERB","ROOT",None),
      t(2,"ich","ich","PRON","sb",1), t(3,"mich","ich","PRON","oa",1,{"Reflex":["Yes"]})
    ]
    m=M.match(toks,pattern("reflexiv.interessieren_fuer"))
    assert m
    assert any("pronominal-adverb" in e for e in m[0].evidence)

def test_ruecksicht_darauf():
    toks=[
      t(0,"Darauf","darauf","ADV","op",4),t(1,"müssen","müssen","AUX","aux",4),
      t(2,"wir","wir","PRON","sb",4),t(3,"Rücksicht","Rücksicht","NOUN","oa",4),
      t(4,"nehmen","nehmen","VERB","ROOT",None)
    ]
    assert M.match(toks,pattern("nvv.ruecksicht_nehmen"))

def test_decision_passive():
    toks=[
      t(0,"Die","der","DET","nk",1),t(1,"Entscheidung","Entscheidung","NOUN","sb",3),
      t(2,"wurde","werden","AUX","aux",3),t(3,"getroffen","treffen","VERB","ROOT",None)
    ]
    assert M.match(toks,pattern("nvv.entscheidung_treffen"))


def test_gefallen_tun_detects_keinen_as_negation():
    toks=[
      t(0,"Nein","nein","PART","ng",3), t(1,",",",","PUNCT","punct",0),
      t(2,"damit","damit","ADV","mo",3), t(3,"hast","haben","AUX","ROOT",None),
      t(4,"du","du","PRON","sb",3), t(5,"mir","ich","PRON","da",8,{"Case":["Dat"]}),
      t(6,"keinen","kein","DET","nk",7,{"Case":["Acc"]}),
      t(7,"Gefallen","gefallen","NOUN","oa",8,{"Case":["Acc"]}),
      t(8,"getan","tun","VERB","oc",3), t(9,".",".","PUNCT","punct",3)
    ]
    matches=M.match(toks,pattern("nvv.gefallen_tun"))
    assert matches
    assert matches[0].negated is True
    assert matches[0].negation_token_indices == [6]
    recipient=next(slot for slot in matches[0].bound_slots if slot.slot_id=="recipient")
    assert recipient.token_indices == [5]
    assert recipient.surface == "mir"
    assert recipient.case == ["Dat"]


def test_gefallen_tun_positive_is_not_negated():
    toks=[
      t(0,"Du","du","PRON","sb",3),
      t(1,"mir","ich","PRON","da",3,{"Case":["Dat"]}),
      t(2,"einen","ein","DET","nk",3,{"Case":["Acc"]}),
      t(3,"Gefallen","gefallen","NOUN","oa",4,{"Case":["Acc"]}),
      t(4,"getan","tun","VERB","ROOT",None)
    ]
    matches=M.match(toks,pattern("nvv.gefallen_tun"))
    assert matches
    assert matches[0].negated is False
    assert matches[0].negation_token_indices == []


def test_in_kauf_nehmen_marks_in_kauf_and_nehmen_as_one_expression():
    toks=[
      t(0,"Wir","wir","PRON","sb",4),
      t(1,"nehmen","nehmen","VERB","ROOT",None),
      t(2,"das","das","PRON","oa",1),
      t(3,"in","in","ADP","mo",4),
      t(4,"Kauf","Kauf","NOUN","nk",1),
    ]
    matches=M.match(toks,pattern("idiom.in_kauf_nehmen"))
    assert matches
    assert set(matches[0].token_indices) == {1,3,4}
    assert matches[0].meaning_tr[0] == "bir şeyi göze almak"


def test_sich_vertun_marks_reflexive_and_verb_together():
    toks=[
      t(0,"Ich","ich","PRON","sb",2),
      t(1,"habe","haben","AUX","aux",2),
      t(2,"mich","sich","PRON","oa",3,{"Reflex":["Yes"]}),
      t(3,"vertan","vertun","VERB","ROOT",None),
    ]
    matches=M.match(toks,pattern("reflexiv.vertun"))
    assert matches
    assert set(matches[0].token_indices) == {2,3}
    assert matches[0].canonical == "sich vertun"


def test_verschieben_auf_marks_preposition_and_verb_together():
    toks=[
      t(0,"Wir","wir","PRON","sb",1),
      t(1,"verschieben","verschieben","VERB","ROOT",None),
      t(2,"den","der","DET","nk",3,{"Case":["Acc"]}),
      t(3,"Termin","Termin","NOUN","oa",1,{"Case":["Acc"]}),
      t(4,"auf","auf","ADP","mo",1),
      t(5,"Montag","Montag","NOUN","nk",4,{"Case":["Acc"]}),
    ]
    matches=M.match(toks,pattern("vp.verschieben_auf"))
    assert matches
    assert 1 in matches[0].token_indices
    assert 4 in matches[0].token_indices
    assert matches[0].meaning_tr[0].startswith("bir şeyi")


def test_sprechen_ueber_marks_preposition_and_verb_together():
    toks=[
      t(0,"Wir","wir","PRON","sb",4),
      t(1,"wollen","wollen","AUX","aux",4),
      t(2,"über","über","ADP","mo",4),
      t(3,"das","das","DET","nk",4,{"Case":["Acc"]}),
      t(4,"Wort","Wort","NOUN","oa",5,{"Case":["Acc"]}),
      t(5,"sprechen","sprechen","VERB","ROOT",None),
    ]
    matches=M.match(toks,pattern("vp.sprechen_ueber"))
    assert matches
    assert 2 in matches[0].token_indices
    assert 5 in matches[0].token_indices
    assert matches[0].canonical == "über jemanden/etwas sprechen"


def test_bedanken_bei_requires_full_reflexive_expression():
    incomplete=[
      t(0,"noch","noch","ADV","mo",4),
      t(1,"bei","bei","ADP","mo",4),
      t(2,"unserem","unser","DET","nk",3,{"Case":["Dat"]}),
      t(3,"Sponsor","Sponsor","NOUN","nk",1,{"Case":["Dat"]}),
      t(4,"bedanken","bedanken","VERB","ROOT",None),
    ]
    assert M.match(incomplete,pattern("reflexiv.bedanken_bei")) == []

    complete=[
      t(0,"mich","ich","PRON","oa",4,{"Reflex":["Yes"]}),
      t(1,"noch","noch","ADV","mo",4),
      t(2,"bei","bei","ADP","mo",4),
      t(3,"unserem","unser","DET","nk",4,{"Case":["Dat"]}),
      t(4,"Sponsor","Sponsor","NOUN","nk",2,{"Case":["Dat"]}),
      t(5,"bedanken","bedanken","VERB","ROOT",None),
    ]
    matches=M.match(complete,pattern("reflexiv.bedanken_bei"))
    assert matches
    assert 0 in matches[0].token_indices
    assert 2 in matches[0].token_indices
    assert 5 in matches[0].token_indices
    assert matches[0].canonical == "sich bei jemandem bedanken"
