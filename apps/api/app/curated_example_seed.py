from __future__ import annotations

from sqlalchemy import select

from .db import SessionLocal
from .models import ExampleLexemeMatch, ExampleSentence, ExampleSource


LEARNEN_EXAMPLES = [
    {
        "video_id": "KoLhgG-Sz4k",
        "title": "Learn German: 30 Beispielsätze - 30 phrases + Translation in the subtitles",
        "surface_form": "lerne",
        "sentence": "Seit ich Deutsch lerne, bin ich glücklich.",
        "start_ms": 7000,
        "end_ms": 15000,
        "reference": "youtube-description-timestamp",
    },
    {
        "video_id": "c4nE091F970",
        "title": "Wie lernt man allein nahezu akzentfreies Deutsch? | Easy German Podcast 698",
        "surface_form": "gelernt",
        "sentence": "Du hast uns erzählt, du hast Deutsch eigentlich ganz alleine gelernt.",
        "start_ms": 36000,
        "end_ms": 61000,
        "reference": "easy-german-public-transcript",
    },
    {
        "video_id": "xnqTeFypXjk",
        "title": "Laberpodcast zum Deutschlernen | Easy German Podcast Live in Berlin",
        "surface_form": "lernen",
        "sentence": "Und dort könnt ihr dann zweimal pro Woche unseren Podcast hören und dabei Deutsch lernen.",
        "start_ms": 41000,
        "end_ms": 47000,
        "reference": "public-subtitle-transcript",
    },
    {
        "video_id": "xx6OANMfMDY",
        "title": "So habe ich Deutsch gelernt (A1-C1)",
        "surface_form": "lernen",
        "sentence": "Wie viele Stunden investierst du, um Deutsch zu lernen?",
        "start_ms": 184000,
        "end_ms": 200000,
        "reference": "creator-published-video-timestamp",
    },
    {
        "video_id": "qMZrB1jhP8g",
        "title": "How I Learned German in 6 Months | Deutsch Lernen | My Story",
        "surface_form": "gelernt",
        "sentence": "Heute werde ich mit euch sprechen, wie ich Deutsch gelernt habe und warum ich Deutsch gelernt habe.",
        "start_ms": 2000,
        "end_ms": 14000,
        "reference": "public-transcript",
    },
    {
        "video_id": "ToNZk6PsSuo",
        "title": "So habe ich angefangen, auf Deutsch zu denken",
        "surface_form": "lernte",
        "sentence": "Ich lernte, ganze Satzteile anstelle von einzelnen Wörtern zu lernen.",
        "start_ms": 181000,
        "end_ms": 204000,
        "reference": "public-video-transcript-summary",
    },
]


def seed_curated_lernen_examples() -> int:
    seeded = 0
    with SessionLocal() as db:
        for entry in LEARNEN_EXAMPLES:
            source = db.scalar(
                select(ExampleSource).where(
                    ExampleSource.provider == "youtube",
                    ExampleSource.external_id == entry["video_id"],
                )
            )
            if source is None:
                source = ExampleSource(
                    provider="youtube",
                    external_id=entry["video_id"],
                    title=entry["title"],
                    url=f"https://www.youtube.com/watch?v={entry['video_id']}",
                    language="de",
                    metadata_json={
                        "seed": "curated-lernen-v1",
                        "reference": entry["reference"],
                    },
                )
                db.add(source)
                db.flush()

            sentence = db.scalar(
                select(ExampleSentence).where(
                    ExampleSentence.source_id == source.id,
                    ExampleSentence.start_ms == entry["start_ms"],
                    ExampleSentence.end_ms == entry["end_ms"],
                )
            )
            if sentence is None:
                sentence = ExampleSentence(
                    source_id=source.id,
                    sentence=entry["sentence"],
                    start_ms=entry["start_ms"],
                    end_ms=entry["end_ms"],
                    quality="curated-public-transcript",
                    metadata_json={
                        "seed": "curated-lernen-v1",
                        "reference": entry["reference"],
                    },
                )
                db.add(sentence)
                db.flush()

            match = db.scalar(
                select(ExampleLexemeMatch).where(
                    ExampleLexemeMatch.example_sentence_id == sentence.id,
                    ExampleLexemeMatch.lemma == "lernen",
                )
            )
            if match is None:
                db.add(
                    ExampleLexemeMatch(
                        example_sentence_id=sentence.id,
                        lemma="lernen",
                        surface_form=entry["surface_form"],
                    )
                )

            db.commit()
            seeded += 1
            print(
                f"seeded {seeded}/6: {entry['video_id']} "
                f"{entry['start_ms']}-{entry['end_ms']}ms [{entry['surface_form']}]"
            )

    print(f"curated lernen corpus ready: {seeded} examples")
    return seeded


if __name__ == "__main__":
    count = seed_curated_lernen_examples()
    if count != 6:
        raise SystemExit(f"Expected 6 curated examples, got {count}.")
