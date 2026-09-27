from german_language_engine.engine import GermanLanguageEngine
from german_language_engine.models import Token


class PluralNounNLP:
    def parse(self, text):
        return [
            Token(i=0, text="Länder", lemma="Land", pos="NOUN", morph={"Number": ["Plur"]}),
        ]


class Provider:
    def translate(self, text):
        return {"Land": "ülke"}.get(text)


def test_plural_noun_contextual_meaning_is_realized_in_turkish():
    engine = GermanLanguageEngine(
        nlp=PluralNounNLP(),
        lexical_meaning_provider=Provider(),
    )

    result = engine.analyze("Länder")

    assert result.hover[0].dictionary_meanings_tr == ["ülke"]
    assert result.hover[0].contextual_word_meaning_tr == "ülkeler"
