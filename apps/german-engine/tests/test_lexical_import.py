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
