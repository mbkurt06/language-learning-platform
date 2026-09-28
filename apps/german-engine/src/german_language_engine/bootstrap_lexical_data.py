from __future__ import annotations
import argparse, subprocess, sys, urllib.request
from pathlib import Path

KAIKKI="https://kaikki.org/dictionary/German/kaikki.org-dictionary-German.jsonl"
FREEDICT="https://raw.githubusercontent.com/freedict/fd-dictionaries/master/deu-tur/deu-tur.tei"

def download(url,path):
    if path.exists() and path.stat().st_size: return
    path.parent.mkdir(parents=True,exist_ok=True)
    print("downloading",url)
    urllib.request.urlretrieve(url,path)

def main():
    p=argparse.ArgumentParser(); p.add_argument("--data-dir",default="data/lexical"); a=p.parse_args()
    root=Path(a.data_dir); wiki=root/"kaikki-german.jsonl"; fd=root/"deu-tur.tei"; db=root/"german-lexical.sqlite3"
    download(KAIKKI,wiki); download(FREEDICT,fd)
    subprocess.check_call([sys.executable,"-m","german_language_engine.import_lexical_data","--wiktextract",str(wiki),"--freedict",str(fd),"--output",str(db)])
    print("Set GLE_LEXICAL_DB="+str(db.resolve()))
if __name__=="__main__": main()
