from __future__ import annotations

import hashlib
import re

from .models import Analysis, ExpressionMatch, LearningUnit, Token, TokenMeaning

# These token classes are grammatical glue by default. They can still be learned
# when the expression resolver promotes them as part of a meaningful construction.
SKIP_STANDALONE_POS={"PUNCT","SPACE","SYM","DET","ADP","CCONJ","SCONJ","AUX"}
EXPRESSION_LABELS={
 "IDIOM":"Deyim",
 "FIXED_CONSTRUCTION":"Sabit kalıp",
 "FUNCTION_VERB":"İsim + fiil",
 "NOMEN_VERB":"İsim + fiil",
 "VERB_PREPOSITION":"Fiil + edat",
 "REFLEXIVE_VERB_PREPOSITION":"Refleksif fiil + edat",
 "REFLEXIVE_VERB":"Refleksif fiil",
 "ADJECTIVE_PREPOSITION":"Sıfat + edat",
 "NOUN_PREPOSITION":"İsim + edat",
 "PARTICLE_VERB":"Ayrılabilen fiil",
 "COPULAR_CONSTRUCTION":"Sabit yapı",
 "COLLOCATION":"Kollokasyon",
 "CONNECTOR":"Bağlaç kalıbı",
 "GRAMMAR_CONSTRUCTION":"Gramer kalıbı",
}
POS_LABELS={"NOUN":"İsim","PROPN":"Özel isim","VERB":"Fiil","ADJ":"Sıfat","ADV":"Zarf","PRON":"Zamir","NUM":"Sayı","INTJ":"Ünlem","PART":"Parçacık"}


def _slug(value:str)->str:
 value=re.sub(r"\s+"," ",value.strip().lower())
 return hashlib.sha1(value.encode("utf-8")).hexdigest()[:16]


def _meaning(value:str|None, fallbacks:list[str])->str:
 value=(value or "").strip()
 if value:
  return value
 return next((item.strip() for item in fallbacks if item and item.strip()),"")


def _noun_canonical(lemma:str, lexical_form)->str:
 if not lexical_form:
  return lemma
 singular=lexical_form.singular or lemma
 article=lexical_form.article
 plural=lexical_form.plural
 label=f"{article} {singular}" if article else singular
 if plural and plural.lower()!=singular.lower():
  label+=f", Pl. {plural}"
 return label


class LearningUnitResolver:
 """Turns linguistic analysis into stable, pedagogically meaningful units."""

 def resolve(self,tokens:list[Token],expressions:list[ExpressionMatch],meanings:list[TokenMeaning])->list[LearningUnit]:
  by_token={item.token_index:item for item in meanings}
  units:list[LearningUnit]=[]
  covered:set[int]=set()

  # Prefer the highest-ranked lexical construction for overlapping tokens.
  for expr in sorted(expressions,key=lambda item:(-item.rank,-len(item.token_indices))):
   meaning=_meaning(expr.contextual_meaning_tr,expr.meaning_tr)
   if not meaning:
    continue
   if set(expr.token_indices).issubset(covered):
    continue
   identity=f"expression|{expr.pattern_id}|{meaning.lower()}"
   units.append(LearningUnit(
    id="lu:"+_slug(identity),canonical=expr.canonical,meaning_tr=meaning,
    unit_type=EXPRESSION_LABELS.get(str(expr.type),str(expr.type)),
    token_indices=expr.token_indices,surface=expr.surface,pattern_id=expr.pattern_id,
    grammar_hint=expr.grammar_hint,
   ))
   covered.update(expr.token_indices)

  for token in tokens:
   if token.i in covered or token.pos in SKIP_STANDALONE_POS:
    continue
   item=by_token.get(token.i)
   if not item:
    continue
   meaning=_meaning(item.contextual_meaning_tr,item.dictionary_meanings_tr)
   if not meaning:
    continue
   canonical=_noun_canonical(token.lemma,item.lexical_form) if token.pos=="NOUN" else token.lemma
   identity=f"word|{token.lemma.lower()}|{meaning.lower()}"
   units.append(LearningUnit(
    id="lu:"+_slug(identity),canonical=canonical,lemma=token.lemma,
    meaning_tr=meaning,unit_type=POS_LABELS.get(token.pos,token.pos or "Kelime"),
    token_indices=[token.i],surface=token.text,lexical_form=item.lexical_form,
   ))
  return sorted(units,key=lambda item:min(item.token_indices) if item.token_indices else 10**9)
