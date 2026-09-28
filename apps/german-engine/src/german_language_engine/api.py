from __future__ import annotations
import argparse, json, os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from .engine import GermanLanguageEngine
from .translation import LibreTranslateProvider
from .lexical_senses import SQLiteLexicalSenseProvider

def make_handler(engine):
 class Handler(BaseHTTPRequestHandler):
  def headers_out(self,status=200):
   self.send_response(status); self.send_header("Content-Type","application/json; charset=utf-8")
   self.send_header("Access-Control-Allow-Origin","*"); self.send_header("Access-Control-Allow-Headers","Content-Type")
   self.send_header("Access-Control-Allow-Methods","POST, OPTIONS"); self.end_headers()
  def do_OPTIONS(self): self.headers_out(204)
  def do_GET(self):
   self.headers_out(200 if self.path=="/health" else 404)
   self.wfile.write(b'{"status":"ok"}' if self.path=="/health" else b'{"error":"not_found"}')
  def do_POST(self):
   if self.path not in {"/analyze","/tokens-batch","/expression-groups-batch","/learning-units-batch"}:
    self.headers_out(404); self.wfile.write(b'{"error":"not_found"}'); return
   try:
    payload=json.loads(self.rfile.read(int(self.headers.get("Content-Length","0"))) or b"{}")
    if self.path=="/learning-units-batch":
     texts=payload.get("texts") or []
     if not isinstance(texts,list) or not texts: raise ValueError("texts is required")
     if len(texts)>500: raise ValueError("max 500 texts")
     sources=[str(text or "").strip() for text in texts]
     body=json.dumps({"items":[{"text":source,"learning_units":[unit.model_dump(mode="json") for unit in engine.analyze(source).learning_units]} for source in sources]},ensure_ascii=False).encode()
    elif self.path=="/expression-groups-batch":
     texts=payload.get("texts") or []
     if not isinstance(texts,list) or not texts: raise ValueError("texts is required")
     if len(texts)>500: raise ValueError("max 500 texts")
     sources=[str(text or "").strip() for text in texts]
     body=json.dumps({"items":engine.analyze_expression_groups_batch(sources)},ensure_ascii=False).encode()
    elif self.path=="/tokens-batch":
     texts=payload.get("texts") or []
     if not isinstance(texts,list) or not texts: raise ValueError("texts is required")
     if len(texts)>500: raise ValueError("max 500 texts")
     sources=[str(text or "").strip() for text in texts]
     parsed=engine.nlp.parse_many(sources)
     items=[
      {"text":source,"tokens":[token.model_dump(mode="json") for token in tokens]}
      for source,tokens in zip(sources,parsed)
     ]
     body=json.dumps({"items":items},ensure_ascii=False).encode()
    else:
     text=payload.get("text","").strip()
     if not text: raise ValueError("text is required")
     body=json.dumps(engine.analyze(text).model_dump(mode="json"),ensure_ascii=False).encode()
    self.headers_out(); self.wfile.write(body)
   except Exception as exc:
    body=json.dumps({"error":str(exc)},ensure_ascii=False).encode(); self.headers_out(400); self.wfile.write(body)
  def log_message(self,format,*args): return
 return Handler

def build_engine():
 url=os.getenv("GLE_TRANSLATION_URL","").strip()
 db_path=os.getenv("GLE_LEXICAL_DB","").strip()
 sense_provider=SQLiteLexicalSenseProvider(db_path) if db_path and os.path.exists(db_path) else None
 if not url: return GermanLanguageEngine(lexical_sense_provider=sense_provider)
 provider=LibreTranslateProvider(url,api_key=os.getenv("GLE_TRANSLATION_API_KEY"))
 return GermanLanguageEngine(sentence_meaning_provider=provider,lexical_meaning_provider=provider,lexical_sense_provider=sense_provider)

def serve(host="127.0.0.1",port=8765):
 server=ThreadingHTTPServer((host,port),make_handler(build_engine()))
 print(f"German Language Engine listening on http://{host}:{port}"); server.serve_forever()

def main():
 parser=argparse.ArgumentParser(); parser.add_argument("--host",default="127.0.0.1"); parser.add_argument("--port",type=int,default=8765)
 args=parser.parse_args(); serve(args.host,args.port)
if __name__=="__main__": main()
