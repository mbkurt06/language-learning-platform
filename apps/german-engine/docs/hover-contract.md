# Hover contract — Context first, dictionary second

Target clients are subtitle/readers such as ZDF, ARD and YouTube.

## Sentence level
Analysis reserves `sentence_meaning_tr` for the natural contextual meaning of the complete sentence. Translation is a provider boundary so the structural engine remains reusable.

## Hover order
1. Expression/chunk and its contextual meaning.
2. Compact grammar/use hint.
3. Word meaning in this sentence.
4. Lexical form: nouns show article + singular + plural; verbs can expose principal parts.
5. Other dictionary meanings, collapsed by default.

## Context-sensitive function words
Pronominal adverbs such as `damit`, `darauf`, `davon`, `daran` and `dafür` expose their current meaning and a short `da(r)+preposition` explanation. The analyzer must distinguish pronominal-adverb `damit` from conjunction `damit` (= so that / in order that).

## Target example
For `Nein, damit hast du mir keinen Gefallen getan.` prioritize:
- sentence meaning: Hayır, bunu yaparak bana iyilik etmiş olmadın.
- `jemandem einen Gefallen tun` -> birine iyilik yapmak; + Dativ
- `damit` -> bununla / bunu yaparak; `da(r)+mit`; reference to a previous action/situation
- `der Gefallen · die Gefallen` -> iyilik, jest
- `tun -> getan` as the verb inside the expression.

Expanded lexical/dictionary detail stays optional.
