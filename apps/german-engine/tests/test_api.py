import json
from http.client import HTTPConnection
from threading import Thread
from http.server import ThreadingHTTPServer
from german_language_engine.api import make_handler
from german_language_engine.models import Analysis, Token

class FakeEngine:
 def analyze(self,text):
  return Analysis(text=text,tokens=[Token(i=0,text="Hallo",lemma="Hallo")],expressions=[],unmatched_token_indices=[0])

def test_http_analyze_contract():
 server=ThreadingHTTPServer(("127.0.0.1",0),make_handler(FakeEngine())); Thread(target=server.handle_request,daemon=True).start()
 conn=HTTPConnection("127.0.0.1",server.server_port); conn.request("POST","/analyze",json.dumps({"text":"Hallo"}),{"Content-Type":"application/json"})
 response=conn.getresponse(); data=json.loads(response.read()); server.server_close()
 assert response.status==200 and data["text"]=="Hallo" and "hover" in data
