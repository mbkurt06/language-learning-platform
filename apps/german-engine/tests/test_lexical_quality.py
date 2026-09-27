from german_language_engine.engine import GermanLanguageEngine
from german_language_engine.models import Token
from german_language_engine.translation import LibreTranslateProvider


class PivotLeakProvider(LibreTranslateProvider):
    def __init__(self):
        super().__init__("http://unused")

    def _translate_between(self, text, source, target):
        table = {
            ("gehen", "de", "tr"): "go",
            ("to go", "en", "tr"): "gitmek",
        }
        return table.get((text, source, target))

    def _detect_language(self, text):
        return "en" if text == "go" else "tr"


def test_lexeme_translation_repairs_english_pivot_leak_for_verbs():
    provider = PivotLeakProvider()
    assert provider.translate_lexeme("gehen", "VERB") == "gitmek"


class BedankenAcrossCueNLP:
    def parse(self, text):
        return [
            Token(i=0, text="möchte", lemma="mögen", pos="AUX", dep="mo", head=2),
            Token(i=1, text="ich", lemma="ich", pos="PRON", dep="sb", head=2),
            Token(
                i=2,
                text="mich",
                lemma="ich",
                pos="PRON",
                dep="oa",
                head=7,
                morph={"Case": ["Acc"], "Reflex": ["Yes"]},
            ),
            Token(i=3, text="noch", lemma="noch", pos="ADV", dep="mo", head=7),
            Token(i=4, text="bei", lemma="bei", pos="ADP", dep="mo", head=7),
            Token(
                i=5,
                text="unserem",
                lemma="unser",
                pos="DET",
                dep="nk",
                head=6,
                morph={"Case": ["Dat"]},
            ),
            Token(
                i=6,
                text="Sponsor",
                lemma="Sponsor",
                pos="NOUN",
                dep="nk",
                head=4,
                morph={"Case": ["Dat"]},
            ),
            Token(i=7, text="bedanken", lemma="bedanken", pos="VERB", dep="ROOT"),
        ]


def test_bedanken_hover_prefers_full_expression_across_subtitle_context():
    engine = GermanLanguageEngine(nlp=BedankenAcrossCueNLP())
    result = engine.analyze(
        "möchte ich mich noch bei unserem Sponsor bedanken"
    )

    hover = result.hover[7]
    assert hover.primary_expressions
    expression = hover.primary_expressions[0]
    assert expression.canonical == "sich bei jemandem bedanken"
    assert expression.contextual_meaning_tr == "birine teşekkür etmek"
