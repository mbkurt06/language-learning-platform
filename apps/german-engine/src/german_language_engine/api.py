from __future__ import annotations
import argparse, json, os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from .engine import GermanLanguageEngine
from .translation import LibreTranslateProvider

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
   if self.path!="/analyze":
    self.headers_out(404); self.wfile.write(b'{"error":"not_found"}'); return
   try:
    payload=json.loads(self.rfile.read(int(self.headers.get("Content-Length","0"))) or b"{}")
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
 if not url: return GermanLanguageEngine()
 provider=LibreTranslateProvider(url,api_key=os.getenv("GLE_TRANSLATION_API_KEY"))
 return GermanLanguageEngine(sentence_meaning_provider=provider,lexical_meaning_provider=provider)

def serve(host="127.0.0.1",port=8765):
 server=ThreadingHTTPServer((host,port),make_handler(build_engine()))
 print(f"German Language Engine listening on http://{host}:{port}"); server.serve_forever()

def main():
 parser=argparse.ArgumentParser(); parser.add_argument("--host",default="127.0.0.1"); parser.add_argument("--port",type=int,default=8765)
 args=parser.parse_args(); serve(args.host,args.port)
if __name__=="__main__": main()
