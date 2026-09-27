from __future__ import annotations

import re
from dataclasses import dataclass

from sqlalchemy import select
from youtube_transcript_api import YouTubeTranscriptApi

from .db import SessionLocal
from .models import ExampleLexemeMatch, ExampleSentence, ExampleSource


@dataclass(frozen=True)
class CandidateVideo:
    video_id: str
    title: str


CANDIDATES = [
    CandidateVideo("_fFwfcS_9TY", "How Foreign Kids Learn German Fast | Easy German 596"),
    CandidateVideo("BXv8NUSOZko", "Do People Learn German Everywhere? | Easy German 653"),
    CandidateVideo("ELkk8PQssE4", "6 Common Mistakes Intermediate German Learners Make | Easy German Podcast 642"),
    CandidateVideo("DwQMtqGRscg", "So habe ich Deutsch gelernt | MEINE GESCHICHTE"),
    CandidateVideo("tuD9NsBj7vg", "DKH Institut - Ich lerne Deutsch (Song / Lied / Text)"),
    CandidateVideo("R6XtawFJAj0", "Wie ich Deutsch lerne! (How I Study German!)"),
    CandidateVideo("EhOONXEZRTA", "Easy German 670"),
    CandidateVideo("m9rk87XbqhY", "Easy German street interviews"),
]

LEARNEN_FORMS = re.compile(
    r"\b(lernen|lerne|lernst|lernt|lernte|lerntest|lernten|lerntet|gelernt)\b",
    flags=re.IGNORECASE,
)


def _sentence_window(snippets, index: int) -> tuple[str, int, int]:
    start = max(0, index - 1)
    end = min(len(snippets), index + 2)
    selected = snippets[start:end]

    text = " ".join(
        str(snippet.text).replace("\n", " ").strip()
        for snippet in selected
        if str(snippet.text).strip()
    )
    text = re.sub(r"\s+", " ", text).strip()

    start_ms = round(selected[0].start * 1000)
    last = selected[-1]
    end_ms = round((last.start + last.duration) * 1000)
    return text, start_ms, max(start_ms + 500, end_ms)


def seed_lernen_examples(limit: int = 6) -> int:
    transcript_api = YouTubeTranscriptApi()
    inserted = 0

    with SessionLocal() as db:
        for candidate in CANDIDATES:
            if inserted >= limit:
                break

            try:
                transcript = transcript_api.fetch(
                    candidate.video_id,
                    languages=["de", "de-DE", "de-AT", "de-CH"],
                )
                snippets = list(transcript)
            except Exception as exc:
                print(f"skip {candidate.video_id}: transcript unavailable: {exc}")
                continue

            match_index = None
            surface_form = None
            for index, snippet in enumerate(snippets):
                match = LEARNEN_FORMS.search(str(snippet.text))
                if match:
                    match_index = index
                    surface_form = match.group(1)
                    break

            if match_index is None or surface_form is None:
                print(f"skip {candidate.video_id}: no lernen form in German transcript")
                continue

            sentence, start_ms, end_ms = _sentence_window(snippets, match_index)

            source = db.scalar(
                select(ExampleSource).where(
                    ExampleSource.provider == "youtube",
                    ExampleSource.external_id == candidate.video_id,
                )
            )
            if source is None:
                source = ExampleSource(
                    provider="youtube",
                    external_id=candidate.video_id,
                    title=candidate.title,
                    url=f"https://www.youtube.com/watch?v={candidate.video_id}",
                    language="de",
                    metadata_json={"seed": "lernen-v1"},
                )
                db.add(source)
                db.flush()

            example = db.scalar(
                select(ExampleSentence).where(
                    ExampleSentence.source_id == source.id,
                    ExampleSentence.start_ms == start_ms,
                    ExampleSentence.end_ms == end_ms,
                )
            )
            if example is None:
                example = ExampleSentence(
                    source_id=source.id,
                    sentence=sentence,
                    start_ms=start_ms,
                    end_ms=end_ms,
                    quality="youtube-transcript",
                    metadata_json={"seed": "lernen-v1"},
                )
                db.add(example)
                db.flush()

            lexeme = db.scalar(
                select(ExampleLexemeMatch).where(
                    ExampleLexemeMatch.example_sentence_id == example.id,
                    ExampleLexemeMatch.lemma == "lernen",
                )
            )
            if lexeme is None:
                db.add(
                    ExampleLexemeMatch(
                        example_sentence_id=example.id,
                        lemma="lernen",
                        surface_form=surface_form,
                    )
                )

            db.commit()
            inserted += 1
            print(
                f"seeded {inserted}/{limit}: {candidate.video_id} "
                f"{start_ms}-{end_ms}ms [{surface_form}] {sentence}"
            )

    print(f"lernen corpus ready: {inserted} examples")
    return inserted


if __name__ == "__main__":
    count = seed_lernen_examples()
    if count < 6:
        raise SystemExit(
            f"Only {count} verified examples were available. "
            "Add more candidate videos and rerun the seed."
        )
