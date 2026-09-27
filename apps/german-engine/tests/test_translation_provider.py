from german_language_engine.engine import GermanLanguageEngine
from german_language_engine.models import Token


class FakeNLP:
    def parse(self, text):
        return [
            Token(i=0, text="Propaganda", lemma="Propaganda", pos="NOUN"),
            Token(i=1, text="Dummheit", lemma="Dummheit", pos="NOUN"),
        ]


class FakeTranslationProvider:
    values = {
        "Propaganda": "propaganda",
        "Dummheit": "aptallık",
        "Propaganda Dummheit": "Propaganda, aptallık.",
    }

    def __init__(self):
        self.calls = []

    def translate(self, text):
        self.calls.append(text)
        return self.values.get(text)


def test_provider_supplies_sentence_and_unknown_word_meanings():
    provider = FakeTranslationProvider()
    engine = GermanLanguageEngine(
        nlp=FakeNLP(),
        sentence_meaning_provider=provider,
        lexical_meaning_provider=provider,
    )

    result = engine.analyze("Propaganda Dummheit")

    assert result.sentence_meaning_tr == "Propaganda, aptallık."
    assert result.hover[0].contextual_word_meaning_tr == "propaganda"
    assert result.hover[1].contextual_word_meaning_tr == "aptallık"
    assert result.hover[1].dictionary_meanings_tr == ["aptallık"]


class FunctionalWordNLP:
    def parse(self, text):
        return [
            Token(i=0, text="ist", lemma="sein", pos="AUX"),
            Token(i=1, text="eine", lemma="ein", pos="DET"),
            Token(i=2, text="große", lemma="groß", pos="ADJ"),
            Token(i=3, text="Dummheit", lemma="Dummheit", pos="NOUN"),
        ]


def test_lexical_provider_is_not_used_for_function_words():
    provider = FakeTranslationProvider()
    provider.values = {
        **provider.values,
        "sein": ":",
        "ein": "bir biri",
        "groß": "büyük",
    }
    engine = GermanLanguageEngine(
        nlp=FunctionalWordNLP(),
        lexical_meaning_provider=provider,
    )

    result = engine.analyze("ist eine große Dummheit")

    assert result.hover[0].contextual_word_meaning_tr == "olmak"
    assert result.hover[0].dictionary_meanings_tr == []
    assert result.hover[1].contextual_word_meaning_tr == "bir / belirsiz tanımlık"
    assert result.hover[1].dictionary_meanings_tr == []
    assert result.hover[2].contextual_word_meaning_tr == "büyük"
    assert result.hover[3].contextual_word_meaning_tr == "aptallık"
    assert "sein" not in provider.calls
    assert "ein" not in provider.calls


class KnownNounNumberNLP:
    def parse(self, text):
        return [
            Token(
                i=0,
                text="Wort",
                lemma="Wort",
                pos="NOUN",
                morph={"Number": ["Plur"]},
            ),
            Token(
                i=1,
                text="Wörter",
                lemma="Wort",
                pos="NOUN",
                morph={"Number": ["Plur"]},
            ),
        ]


def test_seeded_noun_surface_overrides_false_plural_morphology():
    provider = FakeTranslationProvider()
    provider.values = {**provider.values, "Wort": "word"}
    engine = GermanLanguageEngine(
        nlp=KnownNounNumberNLP(),
        lexical_meaning_provider=provider,
    )

    result = engine.analyze("Wort Wörter")

    assert result.hover[0].contextual_word_meaning_tr == "kelime"
    assert result.hover[0].dictionary_meanings_tr == ["kelime", "sözcük"]
    assert result.hover[0].lexical_form.singular == "Wort"
    assert result.hover[0].lexical_form.plural == "Wörter"

    assert result.hover[1].contextual_word_meaning_tr == "kelimeler"
    assert "Wort" not in provider.calls
