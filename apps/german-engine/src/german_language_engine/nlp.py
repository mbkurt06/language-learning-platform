from __future__ import annotations
from typing import Protocol
from .models import Token

class NLPAdapter(Protocol):
    def parse(self, text: str) -> list[Token]: ...
    def parse_many(self, texts: list[str]) -> list[list[Token]]: ...

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

    def _tokens_from_doc(self, doc, include_dependencies: bool = True) -> list[Token]:
        out = []
        for t in doc:
            morph = {k: list(t.morph.get(k)) for k in t.morph.to_dict()}
            out.append(Token(
                i=t.i,
                text=t.text,
                lemma=t.lemma_.lower(),
                pos=t.pos_,
                tag=t.tag_,
                dep=t.dep_ if include_dependencies else "",
                head=(t.head.i if t.head.i != t.i else None) if include_dependencies else None,
                morph=morph,
            ))
        return out

    def parse(self, text: str) -> list[Token]:
        return self._tokens_from_doc(self.nlp(text))

    def parse_many(self, texts: list[str]) -> list[list[Token]]:
        # Vocabulary indexing only needs tokenization, lemma, POS, tag and morphology.
        # Running parser/NER separately for every subtitle cue is unnecessarily costly.
        disabled = [name for name in ("parser", "ner") if name in self.nlp.pipe_names]
        docs = self.nlp.pipe(texts, batch_size=64, disable=disabled)
        return [self._tokens_from_doc(doc, include_dependencies=False) for doc in docs]
