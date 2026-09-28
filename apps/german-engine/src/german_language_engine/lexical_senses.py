from __future__ import annotations
import json, sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

@dataclass(frozen=True)
class LexicalSense:
    sense_id:str
    lemma:str
    pos:str
    gloss:str=""
    meanings_tr:tuple[str,...]=()
    tags:tuple[str,...]=()
    article:str|None=None
    plural:str|None=None

class LexicalSenseProvider(Protocol):
    def lookup(self,lemma:str,pos:str="",surface:str="")->list[LexicalSense]: ...
    def canonical_lemma(self,surface:str,lemma:str)->str: ...
    def select(self,lemma:str,pos:str,surface:str,tokens:list,token_index:int)->LexicalSense|None: ...

class NullLexicalSenseProvider:
    def lookup(self,lemma:str,pos:str="",surface:str="")->list[LexicalSense]: return []
    def canonical_lemma(self,surface:str,lemma:str)->str: return lemma
    def select(self,lemma:str,pos:str,surface:str,tokens:list,token_index:int)->LexicalSense|None: return None
    def close(self)->None: pass

class SQLiteLexicalSenseProvider:
    def __init__(self,path:str|Path):
        self.path=str(path); self.db=sqlite3.connect(self.path,check_same_thread=False)
        self.db.row_factory=sqlite3.Row
    def canonical_lemma(self,surface:str,lemma:str)->str:
        # Trust the NLP lemma when it is itself a real dictionary headword. This avoids
        # ambiguous form rows such as ausgeschlafen -> ausschlafen / ausgeschlafen.
        row=self.db.execute(
            "select lemma from senses where lemma=? collate nocase limit 1",(lemma,)
        ).fetchone()
        if row: return str(row["lemma"])
        for value in (surface,lemma):
            row=self.db.execute(
                "select lemma from forms where form=? collate nocase "
                "order by case when lemma=? collate nocase then 1 else 0 end, lemma limit 1",
                (value,value),
            ).fetchone()
            if row: return str(row["lemma"])
        return lemma
    def lookup(self,lemma:str,pos:str="",surface:str="")->list[LexicalSense]:
        canonical=self.canonical_lemma(surface,lemma)
        params=[canonical]; sql="select * from senses where lemma=? collate nocase"
        if pos:
            sql+=" and (pos=? or pos='')"; params.append(pos.upper())
        rows=self.db.execute(sql+" order by ordinal,sense_id",params).fetchall()
        return [LexicalSense(
            sense_id=r["sense_id"],lemma=r["lemma"],pos=r["pos"],gloss=r["gloss"] or "",
            meanings_tr=tuple(json.loads(r["meanings_tr"] or "[]")),
            tags=tuple(json.loads(r["tags"] or "[]")),article=r["article"],plural=r["plural"],
        ) for r in rows]
    def select(self,lemma:str,pos:str,surface:str,tokens:list,token_index:int)->LexicalSense|None:
        senses=self.lookup(lemma,pos,surface)
        if not senses: return None
        token=next((t for t in tokens if t.i==token_index),None)
        reflexive_words={"sich","mich","dich","uns","euch"}
        reflexive=any(t.text.casefold() in reflexive_words and (t.head==token_index or (token and t.head==token.head)) for t in tokens)
        has_object=any(t.head==token_index and (t.dep in {"oa","obj","oc"} or "Acc" in t.morph.get("Case",[])) for t in tokens)
        def score(sense):
            tags=set(sense.tags); value=0
            if reflexive: value+=8 if "reflexive" in tags else -3
            elif "reflexive" in tags: value-=6
            if has_object and ("transitive" in tags): value+=4
            if not has_object and "intransitive" in tags: value+=2
            return value
        return max(senses,key=lambda x:(score(x),-senses.index(x)))
    def close(self)->None: self.db.close()
