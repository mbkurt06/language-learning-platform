from __future__ import annotations

"""
Seed one curated AI article analysis into indexed_contents.

This is a development/golden-fixture helper for validating the browser extension's
persistent AI-cache path without spending an external model request.  The rows are
stored with analysis_source="ai" so /api/v1/content-index/lookup returns them through
exactly the same path as normal AI results.  The analyzer metadata remains explicit
that this is an assistant-curated fixture rather than a Gemini call.
"""

from datetime import datetime, timezone
import hashlib
import re

from sqlalchemy import select

from .config import get_settings
from .db import SessionLocal
from .models import IndexedContent, IndexedSegment, IndexedUnit


URL = "https://www.tagesschau.de/ausland/europa/italien-schuldekret-meloni-100.html"
TITLE = "Was es mit Melonis Schul-Dekret auf sich hat | tagesschau.de"

TOKEN_RE = re.compile(r"[\wÄÖÜäöüßẞ]+(?:['’-][\wÄÖÜäöüßẞ]+)*|\d+(?:[.,]\d+)?|[^\s]", re.UNICODE)


def E(surface: str, canonical: str, meaning: str, grammar: str = "", type_: str = "SEMANTIC_GROUP"):
    return {
        "surface": surface,
        "canonical": canonical,
        "meaning": meaning,
        "grammar": grammar,
        "type": type_,
    }


SEGMENTS = [
    {
        "text": "Melonis umstrittenes Dekret",
        "tr": "Meloni'nin tartışmalı kararnamesi",
        "expressions": [
            E("Melonis umstrittenes Dekret", "jemandes umstrittenes Dekret", "birinin tartışmalı kararnamesi"),
        ],
    },
    {
        "text": "Wahlkampf mit Schulpolitik?",
        "tr": "Okul politikasıyla seçim kampanyası mı?",
        "expressions": [
            E("Wahlkampf mit Schulpolitik", "Wahlkampf mit etwas", "bir şey üzerinden / bir şeyle seçim kampanyası", "mit + Dativ"),
        ],
    },
    {
        "text": "Stand: 02.10.2026 • 15:04 Uhr",
        "tr": "Güncelleme: 02.10.2026 • 15:04",
        "expressions": [],
    },
    {
        "text": "Ausländerquote und Burkaverbot: Italiens Regierung verschärft per Dekret die Regeln an Schulen.",
        "tr": "Yabancı öğrenci oranı ve burka yasağı: İtalya hükümeti okullardaki kuralları kararnameyle sıkılaştırıyor.",
        "expressions": [
            E("Ausländerquote und Burkaverbot", "Ausländerquote und Burkaverbot", "yabancı öğrenci oranı ve burka yasağı"),
            E("per Dekret", "per Dekret", "kararname yoluyla / kararnameyle", "per + Akkusativ"),
            E("verschärft per Dekret die Regeln an Schulen", "Regeln an Schulen verschärfen", "okullardaki kuralları kararnameyle sıkılaştırmak", "etwas (Akkusativ) verschärfen; an + Dativ"),
        ],
    },
    {
        "text": "Doch in der Praxis greifen die Maßnahmen kaum.",
        "tr": "Ancak uygulamada bu önlemler neredeyse hiç etkili olmuyor.",
        "expressions": [
            E("in der Praxis", "in der Praxis", "uygulamada / pratikte", "in + Dativ", "FIXED_CONSTRUCTION"),
            E("greifen die Maßnahmen kaum", "eine Maßnahme greift", "bir önlemin etkili olması; burada: önlemler neredeyse hiç işlemiyor"),
        ],
    },
    {
        "text": "Kritiker sprechen von Nervosität und Wahlkampftaktik.",
        "tr": "Eleştirmenler bunun gerginlik ve seçim kampanyası taktiği olduğunu söylüyor.",
        "expressions": [
            E("sprechen von Nervosität und Wahlkampftaktik", "von etwas sprechen", "bir şeyden söz etmek; burada: gerginlik ve seçim taktiğinden söz etmek", "von + Dativ", "VERB_PREPOSITION"),
        ],
    },
    {
        "text": "Die Politiker aus Italiens rechter Regierungskoalition sind nervös.",
        "tr": "İtalya'nın sağcı hükümet koalisyonundaki siyasetçiler gergin.",
        "expressions": [
            E("aus Italiens rechter Regierungskoalition", "aus etwas kommen / zu etwas gehören", "İtalya'nın sağcı hükümet koalisyonundan", "aus + Dativ"),
        ],
    },
    {
        "text": "Das liegt daran, dass im Jahr 2027 Parlamentswahlen stattfinden - und daran, dass die Rechtsaußen-Partei \"Futuro Nazionale\" unter dem ehemaligen General Roberto Vannacci in Umfragen massiv an Stimmen gewonnen hat.",
        "tr": "Bunun nedeni, 2027'de parlamento seçimlerinin yapılacak olması ve eski general Roberto Vannacci'nin liderliğindeki aşırı sağcı \"Futuro Nazionale\" partisinin anketlerde oylarını büyük ölçüde artırmış olması.",
        "expressions": [
            E("Das liegt daran, dass", "daran liegen, dass ...", "bunun nedeni ... olmasıdır", "daran + Nebensatz", "FIXED_CONSTRUCTION"),
            E("im Jahr 2027", "im Jahr + Jahreszahl", "2027 yılında", "in + Dativ"),
            E("in Umfragen", "in Umfragen", "anketlerde", "in + Dativ"),
            E("an Stimmen gewonnen hat", "an Stimmen gewinnen", "oy kazanmak / oy oranını artırmak", "an + Dativ", "VERB_PREPOSITION"),
        ],
    },
    {
        "text": "Außenminister Tajani und die Röcke",
        "tr": "Dışişleri Bakanı Tajani ve etekler",
        "expressions": [],
    },
    {
        "text": "Und so flüchten die Regierungspolitiker mit teils skurrilen Aussagen nach vorn.",
        "tr": "Böylece hükümet siyasetçileri kısmen tuhaf açıklamalarla öne doğru kaçışa, yani karşı atağa yöneliyor.",
        "expressions": [
            E("flüchten die Regierungspolitiker mit teils skurrilen Aussagen nach vorn", "nach vorn flüchten", "sorundan kaçmak yerine öne atılmak / karşı atağa geçmek", "", "IDIOM"),
            E("mit teils skurrilen Aussagen", "mit Aussagen", "kısmen tuhaf açıklamalarla", "mit + Dativ"),
        ],
    },
    {
        "text": "Außenminister Antonio Tajani versuchte auf einer Parteiveranstaltung für seine Partei \"Forza Italia\" zu werben, indem er sie mit einer Frau verglich:",
        "tr": "Dışişleri Bakanı Antonio Tajani bir parti etkinliğinde, partisi \"Forza Italia\" için propaganda yapmaya çalıştı ve bunu partiyi bir kadınla karşılaştırarak yaptı:",
        "expressions": [
            E("auf einer Parteiveranstaltung", "auf einer Veranstaltung", "bir parti etkinliğinde", "auf + Dativ"),
            E("für seine Partei \"Forza Italia\" zu werben", "für etwas werben", "partisi \"Forza Italia\" için tanıtım yapmak / destek istemek", "für + Akkusativ", "VERB_PREPOSITION"),
            E("indem er sie mit einer Frau verglich", "etwas mit etwas vergleichen", "onu bir kadınla karşılaştırarak", "mit + Dativ", "VERB_PREPOSITION"),
        ],
    },
    {
        "text": "Ich persönlich würde immer die seriösere Frau wählen, vielleicht trägt sie etwas längere Röcke, aber sie ist eine vertrauenswürdige Person, die die Stabilität des Hauses und der Familie garantiert.",
        "tr": "Ben şahsen her zaman daha ciddi olan kadını seçerdim; belki biraz daha uzun etekler giyer ama o, evin ve ailenin istikrarını garanti eden güvenilir bir kişidir.",
        "expressions": [
            E("die seriösere Frau wählen", "jemanden wählen", "daha ciddi olan kadını seçmek"),
            E("etwas längere Röcke", "etwas + Komparativ", "biraz daha uzun etekler", "etwas + Komparativ"),
            E("eine vertrauenswürdige Person", "eine vertrauenswürdige Person", "güvenilir bir kişi"),
            E("die Stabilität des Hauses und der Familie garantiert", "etwas garantieren", "evin ve ailenin istikrarını garanti etmek"),
        ],
    },
    {
        "text": "Und die eher aufgetakelte Frau, welchen Charakter hat sie?",
        "tr": "Peki daha süslü/pasaklı biçimde aşırı hazırlanmış kadın, onun karakteri nasıl?",
        "expressions": [
            E("die eher aufgetakelte Frau", "aufgetakelt sein", "daha gösterişli / aşırı süslenmiş kadın"),
            E("welchen Charakter hat sie", "welchen Charakter haben", "nasıl bir karaktere sahip olmak"),
        ],
    },
    {
        "text": "Sie wirkt faszinierend auf dich, aber später betrügt sie dich und das geht gar nicht.",
        "tr": "Sana çekici geliyor ama sonra seni aldatıyor; bu hiç kabul edilemez.",
        "expressions": [
            E("wirkt faszinierend auf dich", "auf jemanden wirken", "birine etkileyici / çekici gelmek", "auf + Akkusativ", "VERB_PREPOSITION"),
            E("betrügt sie dich", "jemanden betrügen", "birini aldatmak"),
            E("das geht gar nicht", "das geht gar nicht", "bu hiç olmaz / bu kabul edilemez", "", "FIXED_CONSTRUCTION"),
        ],
    },
    {
        "text": "Tajanis Vergleich ging nach hinten los.",
        "tr": "Tajani'nin karşılaştırması ters tepti.",
        "expressions": [
            E("ging nach hinten los", "nach hinten losgehen", "ters tepmek", "", "IDIOM"),
        ],
    },
    {
        "text": "Ganz Italien empörte sich, die Opposition warf ihm ein Frauenbild aus dem vorletzten Jahrhundert vor, und im Netz häuften sich Karikaturen von Tajani im Minirock.",
        "tr": "Tüm İtalya öfkelendi; muhalefet onu iki yüzyıl öncesinden kalma bir kadın anlayışına sahip olmakla suçladı ve internette Tajani'yi mini etekle gösteren karikatürler çoğaldı.",
        "expressions": [
            E("Ganz Italien empörte sich", "sich empören", "tüm İtalya'nın öfkelenmesi / tepki göstermesi", "sich (Akkusativ)", "REFLEXIVE_VERB"),
            E("warf ihm ein Frauenbild aus dem vorletzten Jahrhundert vor", "jemandem etwas vorwerfen", "birine bir şeyi suçlama olarak yöneltmek; burada kadın anlayışını eleştirmek", "jemandem (Dativ) etwas (Akkusativ) vorwerfen"),
            E("im Netz", "im Netz", "internette", "in + Dativ"),
            E("häuften sich Karikaturen", "sich häufen", "karikatürlerin çoğalması / birikmesi", "sich (Akkusativ)", "REFLEXIVE_VERB"),
        ],
    },
    {
        "text": "Melonis Vorstoß im Klassenzimmer",
        "tr": "Meloni'nin sınıftaki girişimi",
        "expressions": [
            E("Vorstoß im Klassenzimmer", "Vorstoß in einem Bereich", "sınıf/okul alanındaki girişim", "in + Dativ"),
        ],
    },
    {
        "text": "Nur einen Tag später ging dann Regierungschefin Giorgia Meloni in die Offensive.",
        "tr": "Sadece bir gün sonra Başbakan Giorgia Meloni karşı atağa geçti.",
        "expressions": [
            E("Nur einen Tag später", "einen Tag später", "sadece bir gün sonra", "Akkusativ der Zeit"),
            E("ging dann Regierungschefin Giorgia Meloni in die Offensive", "in die Offensive gehen", "karşı atağa geçmek / taarruza geçmek", "in + Akkusativ", "IDIOM"),
        ],
    },
    {
        "text": "Mit ihrem Vorschlag, Burkas, also Vollverschleierung, an Schulen zu verbieten und den Anteil von im Ausland geborenen Kindern ohne Italienisch-Kenntnisse auf 30 Prozent pro Klasse zu deckeln.",
        "tr": "Önerisi şuydu: burkaları, yani tam yüz örtüsünü, okullarda yasaklamak ve yurtdışında doğmuş, İtalyanca bilmeyen çocukların sınıf başına oranını yüzde 30 ile sınırlamak.",
        "expressions": [
            E("Mit ihrem Vorschlag", "mit einem Vorschlag", "önerisiyle / öneri olarak", "mit + Dativ"),
            E("Burkas, also Vollverschleierung, an Schulen zu verbieten", "etwas an einem Ort verbieten", "burkayı, yani tam örtünmeyi, okullarda yasaklamak", "etwas (Akkusativ); an + Dativ"),
            E("den Anteil von im Ausland geborenen Kindern ohne Italienisch-Kenntnisse auf 30 Prozent pro Klasse zu deckeln", "einen Anteil auf X Prozent deckeln", "yurtdışında doğmuş ve İtalyanca bilmeyen çocukların oranını sınıf başına yüzde 30 ile sınırlamak", "etwas auf + Akkusativ deckeln"),
            E("im Ausland geborenen Kindern", "im Ausland geboren sein", "yurtdışında doğmuş çocuklar", "in + Dativ"),
        ],
    },
    {
        "text": "Auf einer Parteiveranstaltung sagte sie, es könne nicht sein, dass die Kinder, die sich in einer Klasse ausgegrenzt fühlen, die italienischen Kinder seien, weil sie in der Minderheit seien.",
        "tr": "Bir parti etkinliğinde, bir sınıfta kendini dışlanmış hisseden çocukların azınlıkta oldukları için İtalyan çocuklar olmasının kabul edilemez olduğunu söyledi.",
        "expressions": [
            E("Auf einer Parteiveranstaltung", "auf einer Veranstaltung", "bir parti etkinliğinde", "auf + Dativ"),
            E("es könne nicht sein, dass", "es kann nicht sein, dass ...", "... olması kabul edilemez / olamaz", "", "FIXED_CONSTRUCTION"),
            E("sich in einer Klasse ausgegrenzt fühlen", "sich ausgegrenzt fühlen", "bir sınıfta kendini dışlanmış hissetmek", "sich (Akkusativ); in + Dativ", "REFLEXIVE_CONSTRUCTION"),
            E("in der Minderheit seien", "in der Minderheit sein", "azınlıkta olmak", "in + Dativ", "FIXED_CONSTRUCTION"),
        ],
    },
    {
        "text": "Italienische Medien ordneten diesen Vorstoß sofort ein.",
        "tr": "İtalyan medyası bu girişimi hemen değerlendirdi / bağlamına oturttu.",
        "expressions": [
            E("ordneten diesen Vorstoß sofort ein", "etwas einordnen", "bir şeyi değerlendirmek / bağlamına oturtmak", "etwas (Akkusativ)", "PARTICLE_VERB"),
        ],
    },
    {
        "text": "Die 30-Prozent-Grenze sei bereits seit dem Jahr 2010 per Minister-Erlass vorgeschrieben, nur nie konsequent umgesetzt worden.",
        "tr": "Yüzde 30 sınırının 2010'dan beri bakanlık kararnamesiyle zaten öngörüldüğü, ancak hiçbir zaman tutarlı biçimde uygulanmadığı belirtiliyor.",
        "expressions": [
            E("seit dem Jahr 2010", "seit + Zeitpunkt", "2010 yılından beri", "seit + Dativ"),
            E("per Minister-Erlass vorgeschrieben", "per Erlass vorschreiben", "bakanlık kararnamesiyle öngörülmüş / emredilmiş", "per + Akkusativ"),
            E("nie konsequent umgesetzt worden", "konsequent umgesetzt werden", "hiçbir zaman tutarlı biçimde uygulanmamış olmak", "Passiv: werden + Partizip II"),
        ],
    },
    {
        "text": "Und das von Meloni aufgebauschte Problem sei gar keines.",
        "tr": "Meloni'nin abarttığı bu sorunun aslında hiç sorun olmadığı söyleniyor.",
        "expressions": [
            E("von Meloni aufgebauschte Problem", "von jemandem aufgebauscht", "Meloni tarafından abartılan sorun", "von + Dativ; Partizip II als Adjektiv"),
            E("sei gar keines", "gar kein Problem sein", "aslında hiç sorun olmamak", "Konjunktiv I"),
        ],
    },
    {
        "text": "Von rund 300.000 Schulklassen in ganz Italien gebe es nur etwa 1.000, bei denen der Anteil zugewanderter Kinder - also solcher, die im Ausland geboren und dann eingewandert sind - bei über 20 Prozent liege.",
        "tr": "İtalya genelindeki yaklaşık 300 bin sınıfın yalnızca yaklaşık bininde göçmen çocukların oranının yüzde 20'nin üzerinde olduğu belirtiliyor; bunlar yurtdışında doğup daha sonra İtalya'ya göç etmiş çocuklar.",
        "expressions": [
            E("Von rund 300.000 Schulklassen in ganz Italien", "von + Gesamtmenge", "İtalya genelindeki yaklaşık 300 bin sınıftan", "von + Dativ"),
            E("im Ausland geboren", "im Ausland geboren sein", "yurtdışında doğmuş olmak", "in + Dativ"),
            E("dann eingewandert sind", "einwandern", "daha sonra göç etmiş olmak", "Perfekt: sein + Partizip II"),
            E("bei über 20 Prozent liege", "bei X Prozent liegen", "oranı yüzde 20'nin üzerinde olmak", "bei + Dativ", "VERB_PREPOSITION"),
        ],
    },
    {
        "text": "Einige wenige Schulen mit hohem Ausländeranteil, die das neue Gesetz tatsächlich betreffen dürfte, liegen in Norditalien.",
        "tr": "Yeni yasanın gerçekten etkilemesi beklenen, yabancı öğrenci oranı yüksek birkaç okul Kuzey İtalya'da bulunuyor.",
        "expressions": [
            E("mit hohem Ausländeranteil", "mit hohem Anteil", "yabancı öğrenci oranı yüksek", "mit + Dativ"),
            E("die das neue Gesetz tatsächlich betreffen dürfte", "jemanden / etwas betreffen", "yeni yasanın gerçekten etkilemesi muhtemel olan", "dürfte + Infinitiv"),
            E("liegen in Norditalien", "in einem Gebiet liegen", "Kuzey İtalya'da bulunmak", "in + Dativ"),
        ],
    },
    {
        "text": "Doch auch hier werde es bei der Umsetzung Schwierigkeiten geben, urteilen italienische Medien: Kinder könnten zwar an umliegende Schulen verteilt werden.",
        "tr": "İtalyan medyasına göre burada da uygulamada zorluklar olacak: çocuklar çevredeki okullara dağıtılabilir.",
        "expressions": [
            E("bei der Umsetzung", "bei der Umsetzung", "uygulama sırasında / uygulamada", "bei + Dativ"),
            E("Schwierigkeiten geben", "es gibt Schwierigkeiten", "zorluklar olmak / ortaya çıkmak"),
            E("an umliegende Schulen verteilt werden", "jemanden an Schulen verteilen", "çocukları çevredeki okullara dağıtmak", "an + Akkusativ; Passiv"),
        ],
    },
    {
        "text": "Doch wegen des verfassungsmäßigen Rechts auf Bildung dürften diese nicht weiter als 20 Kilometer entfernt vom Wohnort liegen - und das sei in einigen Gegenden nicht realistisch.",
        "tr": "Ancak anayasal eğitim hakkı nedeniyle bu okullar ikamet yerinden 20 kilometreden daha uzakta olamaz; bazı bölgelerde bunun gerçekçi olmadığı belirtiliyor.",
        "expressions": [
            E("wegen des verfassungsmäßigen Rechts auf Bildung", "wegen des Rechts auf etwas", "anayasal eğitim hakkı nedeniyle", "wegen + Genitiv; Recht auf + Akkusativ"),
            E("weiter als 20 Kilometer entfernt vom Wohnort liegen", "von etwas entfernt liegen", "ikamet yerinden 20 kilometreden daha uzakta bulunmak", "von + Dativ"),
            E("in einigen Gegenden", "in einer Gegend", "bazı bölgelerde", "in + Dativ"),
        ],
    },
    {
        "text": "Opposition spricht von Ideologie",
        "tr": "Muhalefet ideolojiden söz ediyor",
        "expressions": [
            E("spricht von Ideologie", "von etwas sprechen", "ideolojiden söz etmek", "von + Dativ", "VERB_PREPOSITION"),
        ],
    },
    {
        "text": "Der ehemalige italienische Journalist und Linkspolitiker Michele Santoro betonte zudem im Fernsehsender La7, Melonis Erlass sei Wahlkampftaktik.",
        "tr": "Eski İtalyan gazeteci ve sol siyasetçi Michele Santoro da La7 televizyon kanalında Meloni'nin kararnamesinin seçim kampanyası taktiği olduğunu vurguladı.",
        "expressions": [
            E("im Fernsehsender La7", "in einem Fernsehsender", "La7 televizyon kanalında", "in + Dativ"),
            E("Melonis Erlass sei Wahlkampftaktik", "etwas sei ...", "Meloni'nin kararnamesinin seçim kampanyası taktiği olduğu", "Konjunktiv I"),
        ],
    },
    {
        "text": "Ginge es ihr tatsächlich um die Sache, hätte sie das Dekret viel früher vorgelegt und den Schulen Zeit gegeben, sich darauf vorzubereiten.",
        "tr": "Gerçekten meseleyle ilgileniyor olsaydı, kararnameyi çok daha önce sunar ve okullara buna hazırlanmak için zaman verirdi.",
        "expressions": [
            E("Ginge es ihr tatsächlich um die Sache", "es geht jemandem um etwas", "gerçekten mesele onun için önemli olsaydı / gerçekten meseleyle ilgilenseydi", "jemandem (Dativ) geht es um + Akkusativ", "FIXED_CONSTRUCTION"),
            E("das Dekret viel früher vorgelegt", "etwas vorlegen", "kararnameyi çok daha önce sunmak", "etwas (Akkusativ)", "PARTICLE_VERB"),
            E("den Schulen Zeit gegeben, sich darauf vorzubereiten", "jemandem Zeit geben, sich auf etwas vorzubereiten", "okullara buna hazırlanmak için zaman vermek", "jemandem (Dativ); sich auf + Akkusativ vorbereiten"),
            E("sich darauf vorzubereiten", "sich auf etwas vorbereiten", "buna hazırlanmak", "sich (Akkusativ) auf + Akkusativ", "REFLEXIVE_VERB_PREPOSITION"),
        ],
    },
    {
        "text": "Die inhaltliche Doppelung mit den Burkas mache zudem klar, dass es sich um \"reine Ideologie\" handele.",
        "tr": "Burka konusuyla içeriksel örtüşmenin, bunun \"saf ideoloji\" olduğunu açıkça gösterdiği de söyleniyor.",
        "expressions": [
            E("mache zudem klar, dass", "klar machen, dass ...", "... olduğunu açıkça göstermek", "", "FIXED_CONSTRUCTION"),
            E("dass es sich um \"reine Ideologie\" handele", "es handelt sich um etwas", "söz konusu olanın \"saf ideoloji\" olması / bunun \"saf ideoloji\" olması", "um + Akkusativ", "REFLEXIVE_VERB_PREPOSITION"),
        ],
    },
    {
        "text": "Als Propaganda oder Symbolpolitik haben auch andere Oppositionspolitiker Melonis neues Dekret bezeichnet - als Flucht nach vorn aufgrund einer neuen Bedrohung von Rechtsaußen.",
        "tr": "Diğer muhalefet siyasetçileri de Meloni'nin yeni kararnamesini propaganda ya da sembolik politika, aşırı sağdan gelen yeni bir tehdit nedeniyle öne doğru kaçış olarak nitelendirdi.",
        "expressions": [
            E("Als Propaganda oder Symbolpolitik", "etwas als etwas bezeichnen", "propaganda veya sembolik politika olarak"),
            E("Melonis neues Dekret bezeichnet", "etwas als etwas bezeichnen", "Meloni'nin yeni kararnamesini ... olarak nitelendirmek", "etwas (Akkusativ) als etwas"),
            E("als Flucht nach vorn", "Flucht nach vorn", "öne doğru kaçış / sorundan kaçmak yerine karşı atağa geçme", "", "IDIOM"),
            E("aufgrund einer neuen Bedrohung von Rechtsaußen", "aufgrund + Genitiv", "aşırı sağdan gelen yeni bir tehdit nedeniyle", "aufgrund + Genitiv"),
        ],
    },
    {
        "text": "Zugleich ist das Dekret abgeschwächt worden.",
        "tr": "Aynı zamanda kararname yumuşatıldı.",
        "expressions": [
            E("ist das Dekret abgeschwächt worden", "etwas abschwächen", "kararnamenin yumuşatılmış olması", "Passiv Perfekt: sein + Partizip II + worden", "PASSIVE_CONSTRUCTION"),
        ],
    },
    {
        "text": "Vom ursprünglich von Meloni geforderten Verbot des einfachen muslimischen Kopftuchs - des Hidschabs - ist im fertigen Text keine Rede mehr.",
        "tr": "Meloni'nin başlangıçta talep ettiği basit Müslüman başörtüsü, yani hicap yasağından nihai metinde artık söz edilmiyor.",
        "expressions": [
            E("Vom ursprünglich von Meloni geforderten Verbot des einfachen muslimischen Kopftuchs", "von einem Verbot", "Meloni'nin başlangıçta talep ettiği Müslüman başörtüsü yasağından", "von + Dativ; Partizip II als Adjektiv"),
            E("im fertigen Text", "im Text", "nihai metinde", "in + Dativ"),
            E("ist im fertigen Text keine Rede mehr", "von etwas ist keine Rede mehr", "artık bir şeyden söz edilmemek", "von + Dativ", "FIXED_CONSTRUCTION"),
        ],
    },
    {
        "text": "Umsetzung bleibt fraglich",
        "tr": "Uygulama belirsizliğini koruyor",
        "expressions": [
            E("bleibt fraglich", "fraglich bleiben", "belirsiz / şüpheli kalmak"),
        ],
    },
    {
        "text": "Zwischenzeitlich hat sich selbst Staatspräsident Sergio Mattarella in die Debatte eingemischt: \"Die Schule bildet alle und ist für alle offen.",
        "tr": "Bu arada Cumhurbaşkanı Sergio Mattarella bile tartışmaya müdahil oldu: \"Okul herkesi eğitir ve herkese açıktır.",
        "expressions": [
            E("hat sich selbst Staatspräsident Sergio Mattarella in die Debatte eingemischt", "sich in etwas einmischen", "Cumhurbaşkanı Sergio Mattarella'nın tartışmaya müdahil olması", "sich (Akkusativ) in + Akkusativ", "REFLEXIVE_VERB_PREPOSITION"),
            E("für alle offen", "für jemanden offen sein", "herkese açık olmak", "für + Akkusativ"),
        ],
    },
    {
        "text": "Sie darf keine Mauern errichten, sie muss einen und nicht trennen.\"",
        "tr": "Duvarlar öremez; birleştirmeli, ayırmamalıdır.\"",
        "expressions": [
            E("keine Mauern errichten", "Mauern errichten", "duvarlar örmek / engeller oluşturmak"),
            E("muss einen und nicht trennen", "einen, nicht trennen", "birleştirmeli, ayırmamalı", "müssen + Infinitiv"),
        ],
    },
    {
        "text": "Inzwischen ist das Dekret in Kraft getreten.",
        "tr": "Bu arada kararname yürürlüğe girdi.",
        "expressions": [
            E("ist das Dekret in Kraft getreten", "in Kraft treten", "yürürlüğe girmek", "", "FIXED_CONSTRUCTION"),
        ],
    },
    {
        "text": "Das italienische Parlament hat nun 60 Tage Zeit, es in ein richtiges Gesetz umzuwandeln.",
        "tr": "İtalyan parlamentosunun şimdi bunu gerçek bir yasaya dönüştürmek için 60 günü var.",
        "expressions": [
            E("hat nun 60 Tage Zeit", "Zeit haben, etwas zu tun", "bir şeyi yapmak için 60 günü olmak", "", "FIXED_CONSTRUCTION"),
            E("es in ein richtiges Gesetz umzuwandeln", "etwas in etwas umwandeln", "onu gerçek bir yasaya dönüştürmek", "etwas (Akkusativ) in + Akkusativ", "VERB_PREPOSITION"),
        ],
    },
    {
        "text": "An den Schulen bleibt der Alltag vorerst unverändert: Wie die Quoten und Sprachkontrollen in der Praxis organisiert werden sollen, müssen Schulämter und Rektoren erst noch austüfteln.",
        "tr": "Okullarda günlük yaşam şimdilik değişmiyor: kotaların ve dil kontrollerinin uygulamada nasıl düzenleneceğini okul idareleri ve müdürler henüz ayrıntılı biçimde çözmek zorunda.",
        "expressions": [
            E("An den Schulen", "an den Schulen", "okullarda", "an + Dativ"),
            E("bleibt der Alltag vorerst unverändert", "unverändert bleiben", "günlük hayatın şimdilik değişmeden kalması"),
            E("in der Praxis", "in der Praxis", "uygulamada / pratikte", "in + Dativ", "FIXED_CONSTRUCTION"),
            E("organisiert werden sollen", "organisiert werden sollen", "nasıl düzenlenmesi gerektiği", "Modalverb + Passiv"),
            E("müssen Schulämter und Rektoren erst noch austüfteln", "etwas austüfteln", "okul idareleri ve müdürlerin bunu daha ayrıntılı biçimde düşünüp çözmesi gerekiyor", "müssen + Infinitiv", "PARTICLE_VERB"),
        ],
    },
]


LEXICAL_FORMS = {
    "Ausländerquote": ("Ausländerquote", "NOUN", "die", "Ausländerquote", "Ausländerquoten", "yabancı öğrenci oranı"),
    "Burkaverbot": ("Burkaverbot", "NOUN", "das", "Burkaverbot", "Burkaverbote", "burka yasağı"),
    "Regierung": ("Regierung", "NOUN", "die", "Regierung", "Regierungen", "hükümet"),
    "Dekret": ("Dekret", "NOUN", "das", "Dekret", "Dekrete", "kararname"),
    "Regeln": ("Regel", "NOUN", "die", "Regel", "Regeln", "kurallar"),
    "Schulen": ("Schule", "NOUN", "die", "Schule", "Schulen", "okullar"),
    "Praxis": ("Praxis", "NOUN", "die", "Praxis", "Praxen", "uygulama / pratik"),
    "Maßnahmen": ("Maßnahme", "NOUN", "die", "Maßnahme", "Maßnahmen", "önlemler"),
    "Wahlkampftaktik": ("Wahlkampftaktik", "NOUN", "die", "Wahlkampftaktik", "Wahlkampftaktiken", "seçim kampanyası taktiği"),
    "Regierungskoalition": ("Regierungskoalition", "NOUN", "die", "Regierungskoalition", "Regierungskoalitionen", "hükümet koalisyonu"),
    "Parlamentswahlen": ("Parlamentswahl", "NOUN", "die", "Parlamentswahl", "Parlamentswahlen", "parlamento seçimleri"),
    "Umfragen": ("Umfrage", "NOUN", "die", "Umfrage", "Umfragen", "anketler"),
    "Stimmen": ("Stimme", "NOUN", "die", "Stimme", "Stimmen", "oylar"),
    "Aussagen": ("Aussage", "NOUN", "die", "Aussage", "Aussagen", "açıklamalar"),
    "Parteiveranstaltung": ("Parteiveranstaltung", "NOUN", "die", "Parteiveranstaltung", "Parteiveranstaltungen", "parti etkinliği"),
    "Frau": ("Frau", "NOUN", "die", "Frau", "Frauen", "kadın"),
    "Röcke": ("Rock", "NOUN", "der", "Rock", "Röcke", "etekler"),
    "Person": ("Person", "NOUN", "die", "Person", "Personen", "kişi"),
    "Stabilität": ("Stabilität", "NOUN", "die", "Stabilität", "", "istikrar"),
    "Charakter": ("Charakter", "NOUN", "der", "Charakter", "Charaktere", "karakter"),
    "Vergleich": ("Vergleich", "NOUN", "der", "Vergleich", "Vergleiche", "karşılaştırma"),
    "Opposition": ("Opposition", "NOUN", "die", "Opposition", "Oppositionen", "muhalefet"),
    "Frauenbild": ("Frauenbild", "NOUN", "das", "Frauenbild", "Frauenbilder", "kadın anlayışı"),
    "Jahrhundert": ("Jahrhundert", "NOUN", "das", "Jahrhundert", "Jahrhunderte", "yüzyıl"),
    "Karikaturen": ("Karikatur", "NOUN", "die", "Karikatur", "Karikaturen", "karikatürler"),
    "Vorstoß": ("Vorstoß", "NOUN", "der", "Vorstoß", "Vorstöße", "girişim / hamle"),
    "Vorschlag": ("Vorschlag", "NOUN", "der", "Vorschlag", "Vorschläge", "öneri"),
    "Vollverschleierung": ("Vollverschleierung", "NOUN", "die", "Vollverschleierung", "Vollverschleierungen", "tam yüz örtüsü / tam örtünme"),
    "Anteil": ("Anteil", "NOUN", "der", "Anteil", "Anteile", "oran / pay"),
    "Kinder": ("Kind", "NOUN", "das", "Kind", "Kinder", "çocuklar"),
    "Klasse": ("Klasse", "NOUN", "die", "Klasse", "Klassen", "sınıf"),
    "Minderheit": ("Minderheit", "NOUN", "die", "Minderheit", "Minderheiten", "azınlık"),
    "Medien": ("Medium", "NOUN", "das", "Medium", "Medien", "medya"),
    "Grenze": ("Grenze", "NOUN", "die", "Grenze", "Grenzen", "sınır"),
    "Problem": ("Problem", "NOUN", "das", "Problem", "Probleme", "sorun"),
    "Schulklassen": ("Schulklasse", "NOUN", "die", "Schulklasse", "Schulklassen", "okul sınıfları"),
    "Ausländeranteil": ("Ausländeranteil", "NOUN", "der", "Ausländeranteil", "Ausländeranteile", "yabancı öğrenci oranı"),
    "Gesetz": ("Gesetz", "NOUN", "das", "Gesetz", "Gesetze", "yasa"),
    "Umsetzung": ("Umsetzung", "NOUN", "die", "Umsetzung", "Umsetzungen", "uygulama"),
    "Schwierigkeiten": ("Schwierigkeit", "NOUN", "die", "Schwierigkeit", "Schwierigkeiten", "zorluklar"),
    "Rechts": ("Recht", "NOUN", "das", "Recht", "Rechte", "hak"),
    "Bildung": ("Bildung", "NOUN", "die", "Bildung", "", "eğitim"),
    "Wohnort": ("Wohnort", "NOUN", "der", "Wohnort", "Wohnorte", "ikamet yeri"),
    "Gegenden": ("Gegend", "NOUN", "die", "Gegend", "Gegenden", "bölgeler"),
    "Erlass": ("Erlass", "NOUN", "der", "Erlass", "Erlasse", "kararname / genelge"),
    "Sache": ("Sache", "NOUN", "die", "Sache", "Sachen", "mesele"),
    "Ideologie": ("Ideologie", "NOUN", "die", "Ideologie", "Ideologien", "ideoloji"),
    "Bedrohung": ("Bedrohung", "NOUN", "die", "Bedrohung", "Bedrohungen", "tehdit"),
    "Verbot": ("Verbot", "NOUN", "das", "Verbot", "Verbote", "yasak"),
    "Kopftuchs": ("Kopftuch", "NOUN", "das", "Kopftuch", "Kopftücher", "başörtüsü"),
    "Text": ("Text", "NOUN", "der", "Text", "Texte", "metin"),
    "Rede": ("Rede", "NOUN", "die", "Rede", "Reden", "söz / konuşma"),
    "Debatte": ("Debatte", "NOUN", "die", "Debatte", "Debatten", "tartışma"),
    "Mauern": ("Mauer", "NOUN", "die", "Mauer", "Mauern", "duvarlar"),
    "Parlament": ("Parlament", "NOUN", "das", "Parlament", "Parlamente", "parlamento"),
    "Alltag": ("Alltag", "NOUN", "der", "Alltag", "", "günlük yaşam"),
    "Quoten": ("Quote", "NOUN", "die", "Quote", "Quoten", "kotalar / oranlar"),
    "Sprachkontrollen": ("Sprachkontrolle", "NOUN", "die", "Sprachkontrolle", "Sprachkontrollen", "dil kontrolleri"),
    "Schulämter": ("Schulamt", "NOUN", "das", "Schulamt", "Schulämter", "okul idareleri"),
    "Rektoren": ("Rektor", "NOUN", "der", "Rektor", "Rektoren", "okul müdürleri / rektörler"),
}

COMMON_MEANINGS = {
    "per": "yoluyla / aracılığıyla",
    "in": "-de / içinde",
    "von": "-den / hakkında",
    "mit": "ile",
    "auf": "üzerinde / -e",
    "für": "için",
    "an": "-de / -e",
    "bei": "-de / sırasında",
    "wegen": "nedeniyle",
    "unter": "altında",
    "seit": "-den beri",
    "aus": "-den / içinden",
    "als": "olarak",
    "um": "hakkında / etrafında",
    "darauf": "buna / bunun üzerine",
    "daran": "buna / bunun nedeni olarak",
    "kaum": "neredeyse hiç",
    "gar": "hiç / kesinlikle",
    "noch": "henüz / daha",
}


def tokenize(text: str) -> list[dict]:
    tokens = []
    for i, match in enumerate(TOKEN_RE.finditer(text)):
        surface = match.group(0)
        token = {
            "i": i,
            "surface": surface,
            "lemma": surface,
            "pos": "X",
            "morphology": {},
            "contextual_meaning_tr": COMMON_MEANINGS.get(surface.lower(), ""),
            "_start": match.start(),
            "_end": match.end(),
        }
        lexical = LEXICAL_FORMS.get(surface)
        if lexical:
            lemma, pos, article, singular, plural, meaning = lexical
            token.update({
                "lemma": lemma,
                "pos": pos,
                "contextual_meaning_tr": meaning,
                "dictionary_meanings_tr": [meaning],
                "lexical_form": {
                    "article": article,
                    "singular": singular,
                    "plural": plural,
                },
            })
        tokens.append(token)
    return tokens


def expression_for(text: str, tokens: list[dict], spec: dict) -> dict:
    at = text.find(spec["surface"])
    if at < 0:
        raise ValueError(f"Expression surface not found: {spec['surface']!r} in {text!r}")
    end = at + len(spec["surface"])
    indices = [
        token["i"]
        for token in tokens
        if token["_end"] > at and token["_start"] < end
    ]
    if not indices:
        raise ValueError(f"No token indices for expression: {spec['surface']!r}")
    return {
        "type": spec["type"],
        "surface": spec["surface"],
        "canonical": spec["canonical"],
        "grammar_hint": spec["grammar"],
        "token_indices": indices,
        "highlight_parts": [tokens[i]["surface"] for i in indices],
        "contextual_meaning_tr": spec["meaning"],
    }


def build_segment(index: int, raw: dict) -> dict:
    tokens = tokenize(raw["text"])
    expressions = [expression_for(raw["text"], tokens, spec) for spec in raw["expressions"]]
    clean_tokens = []
    for token in tokens:
        clean_tokens.append({k: v for k, v in token.items() if not k.startswith("_")})
    return {
        "index": index,
        "text": raw["text"],
        "sentence_translation": raw["tr"],
        "tokens": clean_tokens,
        "expressions": expressions,
    }


def content_hash(segments: list[dict]) -> str:
    normalized = "\n".join(" ".join(item["text"].split()) for item in segments)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def persist_segment(db, content: IndexedContent, item: dict) -> None:
    segment = IndexedSegment(
        content_id=content.id,
        sequence_index=item["index"],
        start_ms=item["index"] * 1000,
        end_ms=item["index"] * 1000 + 900,
        source_text=item["text"],
        translation_text=item["sentence_translation"],
        analysis_json={
            "tokens": item["tokens"],
            "expressions": item["expressions"],
            "analysis_source": "ai",
        },
    )
    db.add(segment)
    db.flush()

    for token in item["tokens"]:
        lemma = str(token.get("lemma") or token.get("surface") or "").strip()
        if not lemma:
            continue
        db.add(IndexedUnit(
            segment_id=segment.id,
            kind="word",
            canonical_form=lemma,
            canonical_key=lemma.lower(),
            surface_form=str(token.get("surface") or lemma),
            language_specific_type=str(token.get("pos") or "") or None,
            contextual_meaning=token.get("contextual_meaning_tr") or None,
            token_indices_json=[token["i"]],
            metadata_json={
                "morphology": token.get("morphology") or {},
                "dictionary_meanings_tr": token.get("dictionary_meanings_tr") or [],
                "lexical_form": token.get("lexical_form") or {},
            },
        ))

    for expression in item["expressions"]:
        canonical = expression["canonical"]
        kind = expression["type"]
        db.add(IndexedUnit(
            segment_id=segment.id,
            kind="expression",
            canonical_form=canonical,
            canonical_key=f"{kind.lower()}:{canonical.lower()}",
            surface_form=expression["surface"],
            language_specific_type=kind,
            contextual_meaning=expression["contextual_meaning_tr"],
            token_indices_json=expression["token_indices"],
            metadata_json={
                "grammar_hint": expression["grammar_hint"],
                "highlight_parts": expression["highlight_parts"],
            },
        ))


def main() -> None:
    settings = get_settings()
    segments = [build_segment(index, raw) for index, raw in enumerate(SEGMENTS)]

    with SessionLocal() as db:
        existing = list(db.scalars(
            select(IndexedContent).where(
                IndexedContent.provider == "web",
                IndexedContent.external_id == URL,
                IndexedContent.source_language == "de",
                IndexedContent.target_language == "tr",
                IndexedContent.analysis_schema_version == settings.ai_analysis_schema_version,
            )
        ))
        for row in existing:
            db.delete(row)
        db.flush()

        content = IndexedContent(
            provider="web",
            source_type="article",
            external_id=URL,
            url=URL,
            title=TITLE,
            source_language="de",
            target_language="tr",
            content_hash=content_hash(segments),
            analysis_schema_version=settings.ai_analysis_schema_version,
            analyzer_provider="openai-curated",
            analyzer_model="gpt-5.6-sol-curated",
            status="ready",
            metadata_json={
                "indexed_by": "assistant-curated-fixture",
                "purpose": "semantic-group-hover-test",
                "source_url": URL,
                "progress": {
                    "completed_batches": 1,
                    "total_batches": 1,
                    "completed_segments": len(segments),
                    "total_segments": len(segments),
                },
            },
            analyzed_at=datetime.now(timezone.utc),
        )
        db.add(content)
        db.flush()

        for item in segments:
            persist_segment(db, content, item)

        db.commit()
        print(
            f"Seeded {len(segments)} curated AI segments for {URL}\n"
            f"content_id={content.id}\n"
            f"analysis_source=ai analyzer_provider={content.analyzer_provider}"
        )


if __name__ == "__main__":
    main()
