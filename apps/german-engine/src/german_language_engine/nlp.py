from __future__ import annotations
from typing import Protocol
from .models import Token

class NLPAdapter(Protocol):
    def parse(self, text: str) -> list[Token]: ...

class SpacyGermanAdapter:
    def __init__(self, model: str = "de_core_news_md"):
        try:
            import spacy
        except ImportError as exc:
            raise RuntimeError('Install NLP dependencies with: pip install -e ".[nlp]"') from exc
        try:
            self.nlp = spacy.load(model)
        except OSError as exc:
            raise RuntimeError(f"spaCy model {model!r} is not installed") from exc

    def parse(self, text: str) -> list[Token]:
        doc = self.nlp(text)
        out = []
        for t in doc:
            morph = {k: list(t.morph.get(k)) for k in t.morph.to_dict()}
            out.append(Token(
                i=t.i, text=t.text, lemma=t.lemma_.lower(), pos=t.pos_, tag=t.tag_,
                dep=t.dep_, head=t.head.i if t.head.i != t.i else None, morph=morph
            ))
        return out
