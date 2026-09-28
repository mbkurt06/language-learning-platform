import sqlite3
from unittest.mock import patch

from german_language_engine.api import build_engine
from german_language_engine.lexical_senses import SQLiteLexicalSenseProvider


def test_build_engine_loads_lexical_database_from_environment(tmp_path, monkeypatch):
    db = tmp_path / "lexical.sqlite3"
    conn = sqlite3.connect(db)
    conn.executescript(
        """
        CREATE TABLE senses (
            sense_id TEXT PRIMARY KEY,
            lemma TEXT NOT NULL,
            pos TEXT NOT NULL,
            ordinal INTEGER NOT NULL,
            gloss TEXT,
            meanings_tr TEXT NOT NULL,
            tags TEXT NOT NULL,
            article TEXT,
            plural TEXT
        );
        CREATE TABLE forms (
            form TEXT NOT NULL,
            lemma TEXT NOT NULL,
            pos TEXT NOT NULL
        );
        """
    )
    conn.commit()
    conn.close()

    monkeypatch.setenv("GLE_LEXICAL_DB", str(db))
    monkeypatch.delenv("GLE_TRANSLATION_URL", raising=False)

    with patch("german_language_engine.api.GermanLanguageEngine") as engine_cls:
        build_engine()

    provider = engine_cls.call_args.kwargs["lexical_sense_provider"]
    assert isinstance(provider, SQLiteLexicalSenseProvider)
