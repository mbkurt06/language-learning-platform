from __future__ import annotations
from importlib.resources import files
import yaml
from .models import ExpressionPattern

class ExpressionLexicon:
    def __init__(self, patterns: list[ExpressionPattern]):
        self.patterns = patterns
        self.by_head: dict[str, list[ExpressionPattern]] = {}
        for p in patterns:
            self.by_head.setdefault(p.head_lemma.lower(), []).append(p)

    @classmethod
    def bundled(cls) -> "ExpressionLexicon":
        data_dir = files("german_language_engine").joinpath("data")
        patterns: list[ExpressionPattern] = []
        for path in sorted(
            (item for item in data_dir.iterdir() if item.name.endswith(".yml")),
            key=lambda item: item.name,
        ):
            raw = path.read_text(encoding="utf-8")
            data = yaml.safe_load(raw) or []
            patterns.extend(ExpressionPattern.model_validate(item) for item in data)
        return cls(patterns)

    @classmethod
    def from_yaml(cls, raw: str) -> "ExpressionLexicon":
        data = yaml.safe_load(raw) or []
        return cls([ExpressionPattern.model_validate(item) for item in data])

    def candidates(self, head_lemma: str) -> list[ExpressionPattern]:
        return self.by_head.get(head_lemma.lower(), [])
