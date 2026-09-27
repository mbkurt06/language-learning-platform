from __future__ import annotations

import json
from functools import lru_cache
from typing import Protocol
from urllib.request import Request, urlopen


class TranslationProvider(Protocol):
    def translate(self, text: str) -> str | None: ...


class LexicalTranslationProvider(Protocol):
    def translate_lexeme(self, text: str, pos: str = "") -> str | None: ...


class NullTranslationProvider:
    def translate(self, text: str) -> str | None:
        return None

    def translate_lexeme(self, text: str, pos: str = "") -> str | None:
        return None


class LibreTranslateProvider:
    """German -> Turkish provider for a LibreTranslate-compatible HTTP API.

    Sentence translation and lexical translation deliberately use separate paths.
    Isolated lexemes are prone to pivot-language leakage, so lexical results are
    language-checked and repaired into the requested target language when the
    LibreTranslate /detect endpoint is available.
    """

    def __init__(
        self,
        base_url: str,
        api_key: str | None = None,
        timeout: float = 5.0,
        source: str = "de",
        target: str = "tr",
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self.source = source
        self.target = target

    @lru_cache(maxsize=4096)
    def _translate_between(self, text: str, source: str, target: str) -> str | None:
        text = text.strip()
        if not text:
            return None
        payload = {
            "q": text,
            "source": source,
            "target": target,
            "format": "text",
        }
        if self.api_key:
            payload["api_key"] = self.api_key
        request = Request(
            self.base_url + "/translate",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urlopen(request, timeout=self.timeout) as response:
                result = json.loads(response.read().decode("utf-8"))
        except Exception:
            return None
        translated = result.get("translatedText")
        return translated.strip() if isinstance(translated, str) and translated.strip() else None

    @lru_cache(maxsize=4096)
    def _detect_language(self, text: str) -> str | None:
        text = text.strip()
        if not text:
            return None
        payload = {"q": text}
        if self.api_key:
            payload["api_key"] = self.api_key
        request = Request(
            self.base_url + "/detect",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urlopen(request, timeout=self.timeout) as response:
                result = json.loads(response.read().decode("utf-8"))
        except Exception:
            return None
        if not isinstance(result, list) or not result:
            return None
        best = max(
            (item for item in result if isinstance(item, dict)),
            key=lambda item: float(item.get("confidence", 0) or 0),
            default=None,
        )
        language = best.get("language") if best else None
        return language if isinstance(language, str) and language else None

    @lru_cache(maxsize=4096)
    def translate(self, text: str) -> str | None:
        return self._translate_between(text, self.source, self.target)

    @lru_cache(maxsize=4096)
    def translate_lexeme(self, text: str, pos: str = "") -> str | None:
        translated = self._translate_between(text, self.source, self.target)
        if not translated:
            return None

        detected = self._detect_language(translated)
        if not detected or detected == self.target:
            return translated

        repair_text = translated
        if detected == "en" and pos == "VERB" and " " not in translated:
            repair_text = "to " + translated

        repaired = self._translate_between(repair_text, detected, self.target)
        return repaired or translated
