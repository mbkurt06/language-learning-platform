from __future__ import annotations
from enum import StrEnum
from typing import Any
from pydantic import BaseModel, Field

class ExpressionType(StrEnum):
    IDIOM="IDIOM"; REFLEXIVE_VERB="REFLEXIVE_VERB"; VERB_PREPOSITION="VERB_PREPOSITION"
    REFLEXIVE_VERB_PREPOSITION="REFLEXIVE_VERB_PREPOSITION"; NOMEN_VERB="NOMEN_VERB"
    FUNCTION_VERB="FUNCTION_VERB"; ADJECTIVE_PREPOSITION="ADJECTIVE_PREPOSITION"
    NOUN_PREPOSITION="NOUN_PREPOSITION"; PARTICLE_VERB="PARTICLE_VERB"
    COPULAR_CONSTRUCTION="COPULAR_CONSTRUCTION"
    COLLOCATION="COLLOCATION"; CONNECTOR="CONNECTOR"; FIXED_CONSTRUCTION="FIXED_CONSTRUCTION"
    GRAMMAR_CONSTRUCTION="GRAMMAR_CONSTRUCTION"

class SlotType(StrEnum):
    LEMMA="LEMMA"; REFLEXIVE="REFLEXIVE"; PREPOSITION="PREPOSITION"; PARTICLE="PARTICLE"
    OBJECT="OBJECT"; CLAUSE="CLAUSE"; PRONOMINAL_ADVERB="PRONOMINAL_ADVERB"

class Token(BaseModel):
    i:int; text:str; lemma:str; pos:str=""; tag:str=""; dep:str=""; head:int|None=None
    morph:dict[str,list[str]]=Field(default_factory=dict)

class Slot(BaseModel):
    id:str; type:SlotType; lemma:str|None=None; alternatives:list[str]=Field(default_factory=list)
    case:list[str]=Field(default_factory=list); prep:str|None=None; optional:bool=False

class ExpressionPattern(BaseModel):
    id:str; canonical:str; type:ExpressionType; head_lemma:str; slots:list[Slot]
    meaning_tr:list[str]=Field(default_factory=list); cefr:str|None=None; priority:int=50
    allow_passive:bool=True; allow_flexible_order:bool=True; grammar_hint:str|None=None
    notes:str|None=None

class BoundSlot(BaseModel):
    slot_id:str; token_indices:list[int]=Field(default_factory=list); surface:str=""; case:list[str]=Field(default_factory=list)

class ExpressionMatch(BaseModel):
    pattern_id:str; canonical:str; type:ExpressionType; meaning_tr:list[str]
    token_indices:list[int]; surface:str; confidence:float; evidence:list[str]=Field(default_factory=list)
    grammar_hint:str|None=None; rank:float=0.0
    negated:bool=False; negation_token_indices:list[int]=Field(default_factory=list)
    contextual_meaning_tr:str|None=None
    bound_slots:list[BoundSlot]=Field(default_factory=list)

class LexicalForm(BaseModel):
    article:str|None=None; singular:str|None=None; plural:str|None=None
    principal_parts:list[str]=Field(default_factory=list)

class UsageNote(BaseModel):
    kind:str; label:str; explanation_tr:str; source:str|None=None; refers_to:str|None=None

class TokenMeaning(BaseModel):
    token_index:int; lemma:str; contextual_meaning_tr:str|None=None
    dictionary_meanings_tr:list[str]=Field(default_factory=list)
    lexical_form:LexicalForm|None=None; usage_notes:list[UsageNote]=Field(default_factory=list)

class HoverAnalysis(BaseModel):
    token_index:int; token:str; primary_expressions:list[ExpressionMatch]=Field(default_factory=list)
    contextual_word_meaning_tr:str|None=None; lexical_form:LexicalForm|None=None
    usage_notes:list[UsageNote]=Field(default_factory=list)
    dictionary_meanings_tr:list[str]=Field(default_factory=list)

class Analysis(BaseModel):
    text:str; sentence_meaning_tr:str|None=None; tokens:list[Token]; expressions:list[ExpressionMatch]
    token_meanings:list[TokenMeaning]=Field(default_factory=list)
    hover:dict[int,HoverAnalysis]=Field(default_factory=dict)
    unmatched_token_indices:list[int]; metadata:dict[str,Any]=Field(default_factory=dict)
