from app.seed_curated_article import SEGMENTS, build_segment


def test_curated_article_fixture_builds_all_expression_ranges():
    built = [build_segment(index, raw) for index, raw in enumerate(SEGMENTS)]

    assert len(built) == len(SEGMENTS)
    assert all(item["text"] for item in built)

    for item in built:
        for expression in item["expressions"]:
            assert expression["token_indices"]
            assert expression["highlight_parts"]
