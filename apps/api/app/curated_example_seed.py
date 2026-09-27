from __future__ import annotations

from sqlalchemy import select

from .db import SessionLocal
from .models import ExampleLexemeMatch, ExampleSentence, ExampleSource


OLD_LEARNEN_VIDEO_IDS = [
    "KoLhgG-Sz4k",
    "c4nE091F970",
    "xnqTeFypXjk",
    "xx6OANMfMDY",
    "qMZrB1jhP8g",
    "ToNZk6PsSuo",
]


LEARNEN_EXAMPLES = [
    {
        "video_id": "THVuE41ivpM",
        "title": "Im Aufzug mit Felix Lobrecht",
        "surface_form": "gelernt",
        "sentence": "Danke. Ich hab viel gelernt.",
        "start_ms": 3932000,
        "end_ms": 3942000,
        "reference": "im-aufzug-public-transcript",
    },
    {
        "video_id": "ogpWRmrysp4",
        "title": "Im Aufzug mit Leon Windscheid",
        "surface_form": "gelernt",
        "sentence": "Das hat echt Spaß gemacht, ich habe viel gelernt.",
        "start_ms": 5598000,
        "end_ms": 5608000,
        "reference": "im-aufzug-public-transcript",
    },
    {
        "video_id": "5M0nr7xyTqE",
        "title": "Im Aufzug mit Anne Gersdorff",
        "surface_form": "gelernt",
        "sentence": "Die meisten Sachen, wo ich Sachen gelernt hab, war vielleicht erst mal aus meiner Komfortzone heraus.",
        "start_ms": 2179000,
        "end_ms": 2189000,
        "reference": "im-aufzug-public-transcript",
    },
    {
        "video_id": "ZtPdQuWEtDE",
        "title": "Im Aufzug mit Christoph Amend",
        "surface_form": "gelernt",
        "sentence": "Aber in dem Moment haben wir gelernt, es gab noch einen anderen.",
        "start_ms": 192000,
        "end_ms": 202000,
        "reference": "im-aufzug-public-transcript",
    },
    {
        "video_id": "JdR941OG5a4",
        "title": "Im Aufzug mit Gerhard Jaworek",
        "surface_form": "gelernt",
        "sentence": "Ich habe gelernt, dass der Rasen grün ist, aber ja, das ist für mich nicht mehr als eine Vokabel.",
        "start_ms": 4795000,
        "end_ms": 4805000,
        "reference": "im-aufzug-public-transcript",
    },
    {
        "video_id": "uuzpkXm7K_M",
        "title": "Im Aufzug mit Ralph Caspers",
        "surface_form": "gelernt",
        "sentence": "Ich habe für mich im Studium gelernt: Das Schlimmste ist, sich nicht zu entscheiden.",
        "start_ms": 671000,
        "end_ms": 681000,
        "reference": "im-aufzug-public-transcript",
    },
]


def remove_old_curated_lernen_sources(db) -> None:
    old_sources = db.scalars(
        select(ExampleSource).where(
            ExampleSource.provider == "youtube",
            ExampleSource.external_id.in_(OLD_LEARNEN_VIDEO_IDS),
        )
    ).all()
    for source in old_sources:
        db.delete(source)
    if old_sources:
        db.commit()
        print(f"removed {len(old_sources)} old learning-channel examples")


def seed_curated_lernen_examples() -> int:
    seeded = 0
    with SessionLocal() as db:
        remove_old_curated_lernen_sources(db)

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
                        "seed": "curated-lernen-natural-v2",
                        "reference": entry["reference"],
                    },
                )
                db.add(source)
                db.flush()
            else:
                source.title = entry["title"]
                source.url = f"https://www.youtube.com/watch?v={entry['video_id']}"
                source.metadata_json = {
                    "seed": "curated-lernen-natural-v2",
                    "reference": entry["reference"],
                }

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
                        "seed": "curated-lernen-natural-v2",
                        "reference": entry["reference"],
                    },
                )
                db.add(sentence)
                db.flush()
            else:
                sentence.sentence = entry["sentence"]
                sentence.quality = "curated-public-transcript"
                sentence.metadata_json = {
                    "seed": "curated-lernen-natural-v2",
                    "reference": entry["reference"],
                }

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
            else:
                match.surface_form = entry["surface_form"]

            db.commit()
            seeded += 1
            print(
                f"seeded {seeded}/6 natural: {entry['video_id']} "
                f"{entry['start_ms']}-{entry['end_ms']}ms [{entry['surface_form']}]"
            )

    print(f"natural lernen corpus ready: {seeded} examples")
    return seeded


if __name__ == "__main__":
    count = seed_curated_lernen_examples()
    if count != 6:
        raise SystemExit(f"Expected 6 curated examples, got {count}.")
