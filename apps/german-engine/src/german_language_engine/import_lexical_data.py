from __future__ import annotations
import argparse, gzip, json, sqlite3, xml.etree.ElementTree as ET
from pathlib import Path

POS_MAP={"noun":"NOUN","verb":"VERB","adj":"ADJ","adv":"ADV","name":"PROPN","proper-noun":"PROPN"}

def schema(db):
    db.executescript("""
    create table if not exists senses(
      sense_id text primary key, lemma text not null, pos text not null default '',
      ordinal integer not null default 0, gloss text not null default '',
      meanings_tr text not null default '[]', tags text not null default '[]',
      article text, plural text);
    create index if not exists ix_senses_lemma on senses(lemma collate nocase,pos);
    create table if not exists forms(form text not null collate nocase,lemma text not null,pos text not null default '',primary key(form,lemma,pos));
    create index if not exists ix_forms_form on forms(form collate nocase);
    create table if not exists translations(lemma text not null collate nocase,meaning_tr text not null,primary key(lemma,meaning_tr));
    """)

def _open_text(path):
    return gzip.open(path,"rt",encoding="utf-8") if str(path).endswith(".gz") else open(path,encoding="utf-8")

def _turkish_by_sense(item):
    mapped={}
    for tr in item.get("translations") or []:
        if tr.get("lang_code")!="tr": continue
        word=str(tr.get("word") or "").strip()
        if not word: continue
        sense=str(tr.get("sense") or "").strip()
        mapped.setdefault(sense,[]).append(word)
    return mapped

def _translations_for(gloss,mapped):
    exact=mapped.get(gloss,[])
    if exact: return list(dict.fromkeys(exact))
    candidates=[]
    for sense,values in mapped.items():
        if not sense or not gloss or sense in gloss or gloss in sense:
            candidates.extend(values)
    return list(dict.fromkeys(candidates))

def import_wiktextract(path,db):
    count=0
    with _open_text(path) as fh:
      for line in fh:
        try: item=json.loads(line)
        except json.JSONDecodeError: continue
        if item.get("lang_code")!="de": continue
        word=str(item.get("word") or "").strip()
        pos=POS_MAP.get(str(item.get("pos") or "").lower(),str(item.get("pos") or "").upper())
        if not word: continue
        forms=item.get("forms") or []
        for form in forms:
          value=str(form.get("form") or "").strip()
          if value and value not in {"-","—"}:
            db.execute("insert or ignore into forms(form,lemma,pos) values(?,?,?)",(value,word,pos))
        db.execute("insert or ignore into forms(form,lemma,pos) values(?,?,?)",(word,word,pos))
        entry_tags=set(item.get("tags") or [])
        article="die" if "feminine" in entry_tags else ("der" if "masculine" in entry_tags else ("das" if "neuter" in entry_tags else None))
        plural=None
        for form in forms:
          tags=set(form.get("tags") or []); value=str(form.get("form") or "").strip()
          if not article and {"nominative","singular"}.issubset(tags) and form.get("article") in {"der","die","das"}:
            article=form.get("article")
          if "plural" in tags and "nominative" in tags and value and "table-tags" not in tags:
            plural=plural or value
        turkish=_turkish_by_sense(item)
        for idx,sense in enumerate(item.get("senses") or []):
          tags=set(sense.get("tags") or [])
          if "form-of" in tags: continue
          glosses=sense.get("glosses") or sense.get("raw_glosses") or []
          gloss=str(glosses[0] if glosses else "").strip()
          sid=str(sense.get("id") or sense.get("senseid") or "").strip()
          if not sid: sid=f"wiktextract:{word.casefold()}:{pos}:{idx}"
          meanings=_translations_for(gloss,turkish)
          db.execute("""insert or replace into senses(sense_id,lemma,pos,ordinal,gloss,meanings_tr,tags,article,plural)
             values(?,?,?,?,?,?,?,?,?)""",(sid,word,pos,idx,gloss,json.dumps(meanings,ensure_ascii=False),json.dumps(list(tags),ensure_ascii=False),article,plural))
          count+=1
    return count

def import_freedict(path,db):
    ns={"tei":"http://www.tei-c.org/ns/1.0"}; count=0
    for _,elem in ET.iterparse(path,events=("end",)):
      if not elem.tag.endswith("entry"): continue
      orth=elem.find(".//tei:form/tei:orth",ns)
      if orth is None or not (orth.text or "").strip(): elem.clear(); continue
      lemma=(orth.text or "").strip()
      for quote in elem.findall(".//tei:sense//tei:cit[@type='trans']/tei:quote",ns):
        meaning=" ".join("".join(quote.itertext()).split())
        if meaning:
          db.execute("insert or ignore into translations(lemma,meaning_tr) values(?,?)",(lemma,meaning)); count+=1
      elem.clear()
    return count

def attach_freedict_fallbacks(db):
    rows=db.execute("select lemma,group_concat(meaning_tr,char(31)) meanings from translations group by lemma").fetchall()
    for lemma,joined in rows:
      values=list(dict.fromkeys(x.strip() for x in (joined or "").split(chr(31)) if x.strip()))
      payload=json.dumps(values,ensure_ascii=False)
      db.execute("update senses set meanings_tr=? where lemma=? collate nocase and meanings_tr='[]'",(payload,lemma))

def main():
    p=argparse.ArgumentParser(description="Build offline German lexical sense SQLite index")
    p.add_argument("--wiktextract",required=True); p.add_argument("--freedict"); p.add_argument("--output",required=True)
    a=p.parse_args(); out=Path(a.output); out.parent.mkdir(parents=True,exist_ok=True)
    db=sqlite3.connect(out); schema(db)
    print("wiktextract senses:",import_wiktextract(a.wiktextract,db))
    if a.freedict: print("freedict translations:",import_freedict(a.freedict,db))
    attach_freedict_fallbacks(db); db.commit()
    print("index:",out,"senses:",db.execute("select count(*) from senses").fetchone()[0],"forms:",db.execute("select count(*) from forms").fetchone()[0])
    db.close()
if __name__=="__main__": main()
