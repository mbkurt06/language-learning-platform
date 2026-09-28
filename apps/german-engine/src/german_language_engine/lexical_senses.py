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

class NullLexicalSenseProvider:
    def lookup(self,lemma:str,pos:str="",surface:str="")->list[LexicalSense]: return []
    def canonical_lemma(self,surface:str,lemma:str)->str: return lemma
    def close(self)->None: pass

class SQLiteLexicalSenseProvider:
    def __init__(self,path:str|Path):
        self.path=str(path); self.db=sqlite3.connect(self.path,check_same_thread=False)
        self.db.row_factory=sqlite3.Row
    def canonical_lemma(self,surface:str,lemma:str)->str:
        for value in (surface,lemma):
            row=self.db.execute("select lemma from forms where form=? collate nocase limit 1",(value,)).fetchone()
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
    def close(self)->None: self.db.close()
