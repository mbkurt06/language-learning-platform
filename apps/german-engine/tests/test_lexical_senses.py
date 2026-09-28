import json, sqlite3
from german_language_engine.lexical_senses import SQLiteLexicalSenseProvider

def _db(tmp_path):
    path=tmp_path/"lex.sqlite3"; db=sqlite3.connect(path)
    db.executescript("""
    create table senses(sense_id text primary key,lemma text,pos text,ordinal integer,gloss text,meanings_tr text,tags text,article text,plural text);
    create table forms(form text,lemma text,pos text,primary key(form,lemma,pos));
    """)
    db.execute("insert into forms values('ausgeschlafen','ausschlafen','VERB')")
    db.execute("insert into forms values('aufzuhalten','aufhalten','VERB')")
    db.execute("insert into senses values(?,?,?,?,?,?,?,?,?)",("en-aufhalten-stop","aufhalten","VERB",0,"to halt or stop",json.dumps(["durdurmak","alıkoymak"]),"[]",None,None))
    db.execute("insert into senses values(?,?,?,?,?,?,?,?,?)",("en-aufhalten-stay","aufhalten","VERB",1,"to stay in a place",json.dumps(["bulunmak","kalmak"]),"[]",None,None))
    db.commit(); db.close(); return path

def test_form_normalization_uses_dictionary_lemma(tmp_path):
    p=SQLiteLexicalSenseProvider(_db(tmp_path))
    assert p.canonical_lemma("ausgeschlafen","ausgeschlafen")=="ausschlafen"
    assert p.canonical_lemma("aufzuhalten","aufhalten")=="aufhalten"

def test_senses_keep_stable_ids_and_turkish_glosses(tmp_path):
    p=SQLiteLexicalSenseProvider(_db(tmp_path)); senses=p.lookup("aufhalten","VERB","aufzuhalten")
    assert [x.sense_id for x in senses]==["en-aufhalten-stop","en-aufhalten-stay"]
    assert senses[0].meanings_tr==("durdurmak","alıkoymak")
