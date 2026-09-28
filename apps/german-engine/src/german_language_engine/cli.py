import argparse
import json

from .api import build_engine


def main():
    parser = argparse.ArgumentParser(prog="gle")
    sub = parser.add_subparsers(dest="command", required=True)
    analyze = sub.add_parser("analyze")
    analyze.add_argument("text")
    analyze.add_argument("--model", default="de_core_news_md")
    args = parser.parse_args()

    if args.command == "analyze":
        from .nlp import SpacyGermanAdapter

        engine = build_engine()
        engine.nlp = SpacyGermanAdapter(args.model)
        result = engine.analyze(args.text)
        print(json.dumps(result.model_dump(mode="json"), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
