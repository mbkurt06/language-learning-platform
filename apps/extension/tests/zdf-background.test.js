const test = require("node:test");
const assert = require("node:assert/strict");

function allowedHost(hostname){
  const exact=new Set(["api.zdf.de","zdf-prod-futura.zdf.de","utstreaming.zdf.de"]);
  hostname=hostname.toLowerCase();
  return exact.has(hostname) || hostname.endsWith(".akamaized.net");
}

test("allows every ZDF host required by the runtime pipeline",()=>{
  assert.equal(allowedHost("zdf-prod-futura.zdf.de"),true);
  assert.equal(allowedHost("api.zdf.de"),true);
  assert.equal(allowedHost("utstreaming.zdf.de"),true);
  assert.equal(allowedHost("foo.akamaized.net"),true);
});

test("rejects unrelated hosts",()=>{
  assert.equal(allowedHost("evil.example"),false);
  assert.equal(allowedHost("zdf.de.evil.example"),false);
});
