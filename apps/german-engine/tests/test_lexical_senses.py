import json, sqlite3
from german_language_engine.lexical_senses import SQLiteLexicalSenseProvider
from german_language_engine.models import Token

def _db(tmp_path):
    path=tmp_path/"lex.sqlite3"; db=sqlite3.connect(path)
    db.executescript("""
    create table senses(sense_id text primary key,lemma text,pos text,ordinal integer,gloss text,meanings_tr text,tags text,article text,plural text);
    create table forms(form text,lemma text,pos text,primary key(form,lemma,pos));
    """)
    db.execute("insert into forms values('ausgeschlafen','ausschlafen','VERB')")
    db.execute("insert into forms values('ausgeschlafen','ausgeschlafen','VERB')")
    db.execute("insert into senses values(?,?,?,?,?,?,?,?,?)",("sense-ausschlafen","ausschlafen","VERB",0,"sleep until rested",json.dumps(["uykusunu almak"]),"[]",None,None))
    db.execute("insert into forms values('aufzuhalten','aufhalten','VERB')")
    db.execute("insert into senses values(?,?,?,?,?,?,?,?,?)",("en-aufhalten-stop","aufhalten","VERB",0,"to halt or stop",json.dumps(["durdurmak","alıkoymak"]),"[]",None,None))
    db.execute("insert into senses values(?,?,?,?,?,?,?,?,?)",("en-aufhalten-stay","aufhalten","VERB",1,"to stay in a place",json.dumps(["bulunmak","kalmak"]),json.dumps(["reflexive"]),None,None))
    db.commit(); db.close(); return path

def test_form_normalization_uses_dictionary_lemma(tmp_path):
    p=SQLiteLexicalSenseProvider(_db(tmp_path))
    assert p.canonical_lemma("ausgeschlafen","ausschlafen")=="ausschlafen"
    assert p.canonical_lemma("ausgeschlafen","ausgeschlafen")=="ausschlafen"
    assert p.canonical_lemma("aufzuhalten","aufhalten")=="aufhalten"

def test_senses_keep_stable_ids_and_turkish_glosses(tmp_path):
    p=SQLiteLexicalSenseProvider(_db(tmp_path)); senses=p.lookup("aufhalten","VERB","aufzuhalten")
    assert [x.sense_id for x in senses]==["en-aufhalten-stop","en-aufhalten-stay"]
    assert senses[0].meanings_tr==("durdurmak","alıkoymak")

def test_accusative_object_is_not_mistaken_for_reflexive(tmp_path):
    p=SQLiteLexicalSenseProvider(_db(tmp_path))
    tokens=[
        Token(i=0,text="Er",lemma="er",pos="PRON",dep="sb",head=1,morph={"Person":["3"],"Number":["Sing"]}),
        Token(i=1,text="versucht",lemma="versuchen",pos="VERB",dep="ROOT",head=None),
        Token(i=2,text="mich",lemma="mich",pos="PRON",dep="oa",head=3,morph={"Person":["1"],"Number":["Sing"],"Case":["Acc"]}),
        Token(i=3,text="aufzuhalten",lemma="aufhalten",pos="VERB",dep="oc",head=1),
    ]
    assert p.select("aufhalten","VERB","aufzuhalten",tokens,3).sense_id=="en-aufhalten-stop"

def test_true_reflexive_pronoun_prefers_reflexive_sense(tmp_path):
    p=SQLiteLexicalSenseProvider(_db(tmp_path))
    tokens=[
        Token(i=0,text="Er",lemma="er",pos="PRON",dep="sb",head=1,morph={"Person":["3"],"Number":["Sing"]}),
        Token(i=1,text="hält",lemma="aufhalten",pos="VERB",dep="ROOT",head=None),
        Token(i=2,text="sich",lemma="sich",pos="PRON",dep="oa",head=1,morph={"Person":["3"],"Number":["Sing"],"Case":["Acc"]}),
    ]
    assert p.select("aufhalten","VERB","hält",tokens,1).sense_id=="en-aufhalten-stay"
