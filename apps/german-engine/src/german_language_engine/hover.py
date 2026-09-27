from __future__ import annotations
from .models import HoverAnalysis, TokenMeaning
from .resolver import MatchResolver
class HoverBuilder:
 def __init__(self,resolver:MatchResolver): self.resolver=resolver
 def build(self,tokens,expressions,meanings:list[TokenMeaning]):
  meaning_map={item.token_index:item for item in meanings}; result={}
  for token in tokens:
   meaning=meaning_map[token.i]
   result[token.i]=HoverAnalysis(token_index=token.i,token=token.text,primary_expressions=self.resolver.for_token(token.i,expressions),contextual_word_meaning_tr=meaning.contextual_meaning_tr,lexical_form=meaning.lexical_form,usage_notes=meaning.usage_notes,dictionary_meanings_tr=meaning.dictionary_meanings_tr)
  return result
