from german_language_engine.hover import HoverBuilder
from german_language_engine.meaning import MeaningResolver
from german_language_engine.models import BoundSlot, ExpressionMatch, ExpressionType, Token
from german_language_engine.resolver import MatchResolver

def test_noun_has_article_singular_plural():
 tokens=[Token(i=0,text="Gefallen",lemma="Gefallen",pos="NOUN")]
 item=MeaningResolver().word_meanings(tokens,[])[0]
 assert (item.lexical_form.article,item.lexical_form.singular,item.lexical_form.plural)==("der","Gefallen","Gefallen")

def test_damit_usage_is_pronominal_adverb():
 tokens=[Token(i=0,text="damit",lemma="damit",pos="ADV")]
 item=MeaningResolver().word_meanings(tokens,[])[0]
 assert item.contextual_meaning_tr=="bununla / bunu yaparak"
 assert item.usage_notes[0].label=="da(r) + mit"

def test_expression_precedes_noun_detail():
 tokens=[Token(i=0,text="Gefallen",lemma="Gefallen",pos="NOUN"),Token(i=1,text="getan",lemma="tun",pos="VERB")]
 expression=ExpressionMatch(pattern_id="nvv.gefallen_tun",canonical="jemandem einen Gefallen tun",type=ExpressionType.NOMEN_VERB,meaning_tr=["birine iyilik yapmak"],token_indices=[0,1],surface="Gefallen getan",confidence=.95,rank=100,grammar_hint="+ Dat. · tun → getan")
 meanings=MeaningResolver().word_meanings(tokens,[expression]); hover=HoverBuilder(MatchResolver()).build(tokens,[expression],meanings)
 assert hover[0].primary_expressions[0].canonical=="jemandem einen Gefallen tun"
 assert hover[0].lexical_form.article=="der"


def test_negated_expression_exposes_contextual_negative_meaning():
 tokens=[Token(i=0,text="Gefallen",lemma="Gefallen",pos="NOUN"),Token(i=1,text="getan",lemma="tun",pos="VERB")]
 expression=ExpressionMatch(pattern_id="nvv.gefallen_tun",canonical="jemandem einen Gefallen tun",type=ExpressionType.NOMEN_VERB,meaning_tr=["birine iyilik yapmak"],token_indices=[0,1],surface="Gefallen getan",confidence=.95,rank=100,negated=True,negation_token_indices=[2])
 meanings=MeaningResolver().word_meanings(tokens,[expression])
 assert expression.contextual_meaning_tr=="birine iyilik yapmamak"
 assert meanings[0].contextual_meaning_tr=="birine iyilik yapmamak"


def test_bound_dative_recipient_is_realized_before_negation():
 tokens=[
  Token(i=0,text="mir",lemma="ich",pos="PRON",morph={"Case":["Dat"]}),
  Token(i=1,text="Gefallen",lemma="Gefallen",pos="NOUN"),
  Token(i=2,text="getan",lemma="tun",pos="VERB"),
 ]
 expression=ExpressionMatch(
  pattern_id="nvv.gefallen_tun",canonical="jemandem einen Gefallen tun",type=ExpressionType.NOMEN_VERB,
  meaning_tr=["birine iyilik yapmak"],token_indices=[0,1,2],surface="mir Gefallen getan",
  confidence=.95,rank=100,negated=True,negation_token_indices=[3],
  bound_slots=[BoundSlot(slot_id="recipient",token_indices=[0],surface="mir",case=["Dat"])],
 )
 meanings=MeaningResolver().word_meanings(tokens,[expression])
 assert expression.contextual_meaning_tr=="bana iyilik yapmamak"
 assert meanings[0].contextual_meaning_tr=="bana iyilik yapmamak"


def test_perfect_second_person_negation_is_realized_as_finite_turkish():
 tokens=[
  Token(i=0,text="hast",lemma="haben",pos="AUX",dep="ROOT",head=None,morph={"Person":["2"],"Number":["Sing"],"VerbForm":["Fin"]}),
  Token(i=1,text="du",lemma="du",pos="PRON",dep="sb",head=0,morph={"Case":["Nom"],"Person":["2"],"Number":["Sing"]}),
  Token(i=2,text="mir",lemma="mir",pos="PRON",dep="da",head=4,morph={"Case":["Dat"],"Person":["1"],"Number":["Sing"]}),
  Token(i=3,text="Gefallen",lemma="gefallen",pos="NOUN",dep="oa",head=4,morph={"Case":["Acc"]}),
  Token(i=4,text="getan",lemma="tun",pos="VERB",dep="oc",head=0,morph={"VerbForm":["Part"]}),
 ]
 expression=ExpressionMatch(
  pattern_id="nvv.gefallen_tun",canonical="jemandem einen Gefallen tun",type=ExpressionType.NOMEN_VERB,
  meaning_tr=["birine iyilik yapmak"],token_indices=[2,3,4],surface="mir Gefallen getan",
  confidence=.95,rank=100,negated=True,
  bound_slots=[BoundSlot(slot_id="recipient",token_indices=[2],surface="mir",case=["Dat"])],
 )
 meanings=MeaningResolver().word_meanings(tokens,[expression])
 assert expression.contextual_meaning_tr=="bana iyilik yapmadın"
 assert meanings[2].contextual_meaning_tr=="bana iyilik yapmadın"


def test_observed_subtitle_words_have_lexical_fallback():
 tokens=[
  Token(i=0,text="bekommen",lemma="bekommen",pos="VERB"),
  Token(i=1,text="Rundfunkanstaltung",lemma="Rundfunkanstaltung",pos="NOUN"),
 ]
 meanings=MeaningResolver().word_meanings(tokens,[])
 assert meanings[0].contextual_meaning_tr=="almak"
 assert meanings[0].dictionary_meanings_tr==["almak","elde etmek","edinmek"]
 assert meanings[1].contextual_meaning_tr=="yayın kuruluşu"
 assert meanings[1].lexical_form.article=="die"
 assert meanings[1].lexical_form.plural=="Rundfunkanstalten"


def test_so_prefers_contextual_turkish_meaning_boyle():
 tokens=[Token(i=0,text="so",lemma="so",pos="ADV")]
 item=MeaningResolver().word_meanings(tokens,[])[0]
 assert item.contextual_meaning_tr=="böyle"
 assert item.dictionary_meanings_tr[0]=="böyle"


def test_function_words_use_contextual_meaning_before_dictionary_fallback():
 tokens=[
  Token(i=0,text="so",lemma="so",pos="ADV"),
  Token(i=1,text="mit",lemma="mit",pos="ADP",morph={"Case":["Dat"]}),
  Token(i=2,text="auf",lemma="auf",pos="ADP",morph={"Case":["Acc"]}),
  Token(i=3,text="mir",lemma="ich",pos="PRON",morph={"Case":["Dat"],"Number":["Sing"]}),
 ]
 meanings=MeaningResolver().word_meanings(tokens,[])
 assert meanings[0].contextual_meaning_tr.startswith("böyle")
 assert meanings[1].contextual_meaning_tr=="ile / birlikte"
 assert meanings[2].contextual_meaning_tr=="üzerine / -e"
 assert meanings[3].contextual_meaning_tr=="bana"


def test_expression_meaning_still_beats_generic_preposition_meaning():
 tokens=[
  Token(i=0,text="über",lemma="über",pos="ADP",morph={"Case":["Acc"]}),
  Token(i=1,text="sprechen",lemma="sprechen",pos="VERB"),
 ]
 expression=ExpressionMatch(
  pattern_id="vp.sprechen_ueber",
  canonical="über jemanden/etwas sprechen",
  type=ExpressionType.VERB_PREPOSITION,
  meaning_tr=["biri/bir şey hakkında konuşmak"],
  token_indices=[0,1],
  surface="über sprechen",
  confidence=.95,
  rank=100,
 )
 meanings=MeaningResolver().word_meanings(tokens,[expression])
 assert meanings[0].contextual_meaning_tr=="biri/bir şey hakkında konuşmak"


def test_bevor_has_contextual_meaning_and_grammar_role():
 tokens=[Token(i=0,text="bevor",lemma="bevor",pos="SCONJ",dep="cp")]
 item=MeaningResolver().word_meanings(tokens,[])[0]
 assert item.contextual_meaning_tr=="önce / -meden önce"
 assert any(note.kind=="GRAMMAR_ROLE" for note in item.usage_notes)
 assert any("Yan cümleyi ana cümleye bağlar" in note.explanation_tr for note in item.usage_notes)


def test_determiner_and_conjunction_have_contextual_fallbacks():
 tokens=[
  Token(i=0,text="und",lemma="und",pos="CCONJ"),
  Token(i=1,text="der",lemma="der",pos="DET"),
 ]
 meanings=MeaningResolver().word_meanings(tokens,[])
 assert meanings[0].contextual_meaning_tr=="ve"
 assert "belirli" in meanings[1].contextual_meaning_tr
