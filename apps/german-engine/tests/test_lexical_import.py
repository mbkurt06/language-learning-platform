import json, sqlite3
from german_language_engine.import_lexical_data import schema, import_wiktextract, attach_freedict_fallbacks

def test_wiktionary_turkish_translation_is_kept_per_sense(tmp_path):
    source=tmp_path/"de.jsonl"
    source.write_text(json.dumps({
      "lang_code":"de","word":"Biene","pos":"noun","tags":["feminine"],
      "forms":[{"form":"Bienen","article":"die","tags":["nominative","plural"]}],
      "translations":[{"lang_code":"tr","word":"arı","sense":"uçan böcek"}],
      "senses":[
        {"id":"de-Biene-bee","glosses":["uçan böcek"],"tags":["feminine"]},
        {"id":"de-Biene-girl","glosses":["kız"],"tags":["feminine","dated"]},
      ],
    },ensure_ascii=False)+"\n",encoding="utf-8")
    db=sqlite3.connect(tmp_path/"lex.db"); schema(db)
    assert import_wiktextract(source,db)==2
    bee=db.execute("select meanings_tr,article,plural from senses where sense_id='de-Biene-bee'").fetchone()
    girl=db.execute("select meanings_tr from senses where sense_id='de-Biene-girl'").fetchone()
    assert json.loads(bee[0])==["arı"]
    assert bee[1:] == ("die","Bienen")
    assert json.loads(girl[0])==[]
    db.close()

def test_freedict_only_fills_empty_sense_translations(tmp_path):
    db=sqlite3.connect(tmp_path/"lex.db"); schema(db)
    db.execute("insert into senses values(?,?,?,?,?,?,?,?,?)",("s1","Biene","NOUN",0,"bee",'["arı"]',"[]","die","Bienen"))
    db.execute("insert into senses values(?,?,?,?,?,?,?,?,?)",("s2","Biene","NOUN",1,"girl","[]","[]","die","Bienen"))
    db.execute("insert into translations values(?,?)",("Biene","arı"))
    attach_freedict_fallbacks(db)
    assert json.loads(db.execute("select meanings_tr from senses where sense_id='s1'").fetchone()[0])==["arı"]
    assert json.loads(db.execute("select meanings_tr from senses where sense_id='s2'").fetchone()[0])==["arı"]


def test_subject_pronoun_er_and_sentence_initial_Er_share_one_sense(tmp_path):
    source=tmp_path/"de.jsonl"
    rows=[
      {
        "lang_code":"de","word":"er","pos":"pron",
        "translations":[{"lang_code":"tr","word":"o","sense":"personal pronoun"}],
        "senses":[{"glosses":["personal pronoun"]}],
      },
      {
        "lang_code":"de","word":"Er","pos":"pron",
        "translations":[],
        "senses":[{"glosses":["historical form of address"]}],
      },
    ]
    source.write_text("\n".join(json.dumps(row,ensure_ascii=False) for row in rows)+"\n",encoding="utf-8")
    db=sqlite3.connect(tmp_path/"lex.db"); schema(db)
    assert import_wiktextract(source,db)==1
    senses=db.execute(
        "select sense_id,lemma,meanings_tr from senses where lemma=? collate nocase and pos='PRON'",
        ("er",),
    ).fetchall()
    assert senses==[("wiktextract:er:PRON:0","er",'["o"]')]
    db.close()


def test_uppercase_Er_pronoun_import_removes_legacy_rows(tmp_path):
    source=tmp_path/"de.jsonl"
    source.write_text(json.dumps({
      "lang_code":"de","word":"Er","pos":"pron",
      "senses":[{"glosses":["historical form of address"]}],
    },ensure_ascii=False)+"\n",encoding="utf-8")
    db=sqlite3.connect(tmp_path/"lex.db"); schema(db)
    db.execute(
        "insert into senses values(?,?,?,?,?,?,?,?,?)",
        ("wiktextract:er:PRON:0:case:legacy","Er","PRON",0,"legacy","[]","[]",None,None),
    )
    db.execute("insert into forms values(?,?,?)",("Er","Er","PRON"))
    assert import_wiktextract(source,db)==0
    assert db.execute("select count(*) from senses where lemma='Er' collate binary and pos='PRON'").fetchone()[0]==0
    assert db.execute("select count(*) from forms where lemma='Er' collate binary and pos='PRON'").fetchone()[0]==0
    db.close()


def test_freedict_fallback_does_not_cross_case_distinct_lemmas(tmp_path):
    db=sqlite3.connect(tmp_path/"lex.db"); schema(db)
    db.execute("insert into senses values(?,?,?,?,?,?,?,?,?)",("lower-er","er","PRON",0,"personal pronoun","[]","[]",None,None))
    db.execute("insert into senses values(?,?,?,?,?,?,?,?,?)",("upper-er","Er","PRON",0,"form of address","[]","[]",None,None))
    db.execute("insert into translations values(?,?)",("er","o"))
    attach_freedict_fallbacks(db)
    lower=json.loads(db.execute("select meanings_tr from senses where sense_id='lower-er'").fetchone()[0])
    upper=json.loads(db.execute("select meanings_tr from senses where sense_id='upper-er'").fetchone()[0])
    assert lower==["o"]
    assert upper==[]
    db.close()


def test_freedict_fallback_preserves_exact_case_groups(tmp_path):
    db=sqlite3.connect(tmp_path/"lex.db"); schema(db)
    db.execute("insert into senses values(?,?,?,?,?,?,?,?,?)",("lower-er","er","PRON",0,"personal pronoun","[]","[]",None,None))
    db.execute("insert into senses values(?,?,?,?,?,?,?,?,?)",("upper-er","Er","PRON",0,"form of address","[]","[]",None,None))
    db.execute("insert into translations values(?,?)",("er","o"))
    db.execute("insert into translations values(?,?)",("Er","Bay"))
    attach_freedict_fallbacks(db)
    lower=json.loads(db.execute("select meanings_tr from senses where sense_id='lower-er'").fetchone()[0])
    upper=json.loads(db.execute("select meanings_tr from senses where sense_id='upper-er'").fetchone()[0])
    assert lower==["o"]
    assert upper==["Bay"]
    db.close()
