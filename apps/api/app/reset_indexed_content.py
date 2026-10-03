"""Delete cached/indexed AI analysis for one content URL.

Usage:
    python -m app.reset_indexed_content --url "https://..." --provider zdf

This intentionally deletes IndexedContent rows only. IndexedSegment/IndexedUnit rows
are removed by database cascade. Learning items and encounters are not touched.
"""

from __future__ import annotations

import argparse

from sqlalchemy import or_, select

from .db import SessionLocal
from .models import IndexedContent


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--provider", default="")
    args = parser.parse_args()

    wanted_url = args.url.strip()
    provider = args.provider.strip()

    with SessionLocal() as db:
        query = select(IndexedContent).where(
            or_(
                IndexedContent.url == wanted_url,
                IndexedContent.external_id == wanted_url,
            )
        )
        if provider:
            query = query.where(IndexedContent.provider == provider)

        rows = list(db.scalars(query))
        ids = [str(row.id) for row in rows]
        external_ids = sorted({row.external_id for row in rows})

        for row in rows:
            db.delete(row)
        db.commit()

    print(f"deleted={len(ids)}")
    print(f"provider={provider or '*'}")
    print(f"url={wanted_url}")
    print(f"external_ids={external_ids}")
    print(f"content_ids={ids}")


if __name__ == "__main__":
    main()
