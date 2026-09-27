from __future__ import annotations
from typing import Protocol
class SentenceMeaningProvider(Protocol):
 def translate(self,text:str)->str|None: ...
class NullSentenceMeaningProvider:
 def translate(self,text:str)->str|None: return None
