from __future__ import annotations
from .context import NullSentenceMeaningProvider, SentenceMeaningProvider
from .dynamic import DynamicExpressionDetector
from .translation import TranslationProvider
from .hover import HoverBuilder
from .lexicon import ExpressionLexicon
from .matcher import StructuralMatcher
from .meaning import MeaningResolver
from .models import Analysis, ExpressionType
from .nlp import NLPAdapter, SpacyGermanAdapter
from .resolver import MatchResolver


class GermanLanguageEngine:
 def __init__(self,nlp:NLPAdapter|None=None,lexicon:ExpressionLexicon|None=None,sentence_meaning_provider:SentenceMeaningProvider|None=None,lexical_meaning_provider:TranslationProvider|None=None):
  self.nlp=nlp or SpacyGermanAdapter(); self.lexicon=lexicon or ExpressionLexicon.bundled()
  self.matcher=StructuralMatcher(); self.resolver=MatchResolver(); self.meaning_resolver=MeaningResolver(lexical_meaning_provider)
  self.dynamic_detector=DynamicExpressionDetector()
  self.hover_builder=HoverBuilder(self.resolver); self.sentence_meaning_provider=sentence_meaning_provider or NullSentenceMeaningProvider()

 def _lexicon_expressions(self,tokens):
  candidates=[]; seen=set()
  for token in tokens:
   for pattern in self.lexicon.candidates(token.lemma):
    key=(pattern.id,token.i)
    if key in seen: continue
    seen.add(key)
    for match in self.matcher.match(tokens,pattern):
     match.grammar_hint=pattern.grammar_hint; candidates.append(match)
  patterns={p.id:p for p in self.lexicon.patterns}
  return self.resolver.resolve(candidates,patterns), candidates, patterns

 def analyze_expression_groups_batch(self,texts:list[str])->list[dict]:
  # Surface every expression class that represents a multi-word lexical or
  # grammatical unit. The lexicon/detectors decide whether the combination is
  # meaningful; the UI should not silently drop supported classes.
  wanted={item.value for item in ExpressionType}
  parsed=self.nlp.parse_many_with_dependencies(texts)
  items=[]
  for text,tokens in zip(texts,parsed):
   expressions,_,_=self._lexicon_expressions(tokens)
   dynamic_expressions,_=self.dynamic_detector.detect_groups(tokens)
   expressions=[*expressions,*dynamic_expressions]
   groups=[
    {
     "pattern_id":expr.pattern_id,
     "canonical":expr.canonical,
     "type":str(expr.type),
     "surface":expr.surface,
     "token_indices":expr.token_indices,
     "confidence":expr.confidence,
     "meaning_tr":expr.meaning_tr,
     "contextual_meaning_tr":expr.contextual_meaning_tr,
     "grammar_hint":expr.grammar_hint,
    }
    for expr in expressions
    if str(expr.type) in wanted
   ]
   items.append({"text":text,"expressions":groups})
  return items

 def analyze(self,text:str)->Analysis:
  tokens=self.nlp.parse(text)
  expressions,candidates,patterns=self._lexicon_expressions(tokens)
  dynamic_matches,dynamic_patterns=self.dynamic_detector.detect(tokens,self.meaning_resolver.lexical_meanings)
  candidates.extend(dynamic_matches); patterns.update(dynamic_patterns)
  expressions=self.resolver.resolve(candidates,patterns)
  meanings=self.meaning_resolver.word_meanings(tokens,expressions); hover=self.hover_builder.build(tokens,expressions,meanings)
  covered={i for m in expressions for i in m.token_indices}; unmatched=[t.i for t in tokens if t.i not in covered and t.pos!="PUNCT"]
  return Analysis(text=text,sentence_meaning_tr=self.sentence_meaning_provider.translate(text),tokens=tokens,expressions=expressions,token_meanings=meanings,hover=hover,unmatched_token_indices=unmatched,metadata={"candidate_matches":len(candidates),"lexicon_size":len(self.lexicon.patterns),"ux_policy":"context-first-dictionary-second"})
