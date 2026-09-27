from __future__ import annotations

from sqlalchemy import select

from .db import SessionLocal
from .models import ExampleLexemeMatch, ExampleSentence, ExampleSource


KEEP = {
    "KJ7qOMr_6o0": "MefYou über das Lehrer-Dasein, Kriminalität und seine zweite Chance",
    "kup1mfXtkTc": "Melissa Lee zwischen Berliner Schnauze und Kung Fu-Schule",
    "P0XJHzynUYE": "Sugar MMFK über seine drohende Abschiebung, Doppelleben und Aufwachsen ohne Vater",
    "68-ITNXS78E": "GERMANIA | Donnie O'Sullivan",
    "TpqxiHgyy_Y": "7 Tage ohne Glücksgefühle: Serotonin & Dopamin Detox 😶 Selbstexperiment-Klassiker",
}


def reconcile() -> None:
    with SessionLocal() as db:
        matches = db.scalars(
            select(ExampleLexemeMatch).where(ExampleLexemeMatch.lemma == "lernen")
        ).all()

        removed = 0
        for match in matches:
            sentence = db.get(ExampleSentence, match.example_sentence_id)
            source = db.get(ExampleSource, sentence.source_id) if sentence else None
            if source is None or source.external_id not in KEEP:
                db.delete(match)
                removed += 1

        for external_id, title in KEEP.items():
            source = db.scalar(
                select(ExampleSource).where(
                    ExampleSource.provider == "youtube",
                    ExampleSource.external_id == external_id,
                )
            )
            if source is not None:
                source.title = title
                source.url = f"https://www.youtube.com/watch?v={external_id}"

        db.commit()

        orphan_sentences = db.scalars(select(ExampleSentence)).all()
        orphan_sentence_count = 0
        for sentence in orphan_sentences:
            has_match = db.scalar(
                select(ExampleLexemeMatch.id).where(
                    ExampleLexemeMatch.example_sentence_id == sentence.id
                ).limit(1)
            )
            if has_match is None:
                db.delete(sentence)
                orphan_sentence_count += 1

        orphan_sources = db.scalars(select(ExampleSource)).all()
        orphan_source_count = 0
        for source in orphan_sources:
            has_sentence = db.scalar(
                select(ExampleSentence.id).where(
                    ExampleSentence.source_id == source.id
                ).limit(1)
            )
            if has_sentence is None:
                db.delete(source)
                orphan_source_count += 1

        db.commit()

        print(f"removed lernen matches: {removed}")
        print(f"removed orphan sentences: {orphan_sentence_count}")
        print(f"removed orphan sources: {orphan_source_count}")
        print("lernen visual corpus reconciled to 5 videos")


if __name__ == "__main__":
    reconcile()
