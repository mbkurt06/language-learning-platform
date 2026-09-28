const test = require("node:test");
const assert = require("node:assert/strict");
const { zdfVideoId, isZdfVideoPage, expandPtmdTemplate, subtitleTracksFromPtmd, parseClock } = require("../src/zdf-provider.js");

test("extracts canonical id from current ZDF video URLs", () => {
  assert.equal(zdfVideoId("https://www.zdf.de/video/magazine/heute-journal-104/heute-journal-vom-27-september-2026-100"), "heute-journal-vom-27-september-2026-100");
});

test("rejects non-video and non-ZDF URLs", () => {
  assert.equal(zdfVideoId("https://www.zdf.de/nachrichten"), "");
  assert.equal(zdfVideoId("https://example.com/video/test-100"), "");
  assert.equal(isZdfVideoPage("https://www.zdf.de/nachrichten"), false);
});

test("expands ZDF PTMD templates with the supported player id", () => {
  assert.equal(
    expandPtmdTemplate("/tmd/2/{playerId}/vod/ptmd/mediathek/example/3"),
    "https://api.zdf.de/tmd/2/android_native_6/vod/ptmd/mediathek/example/3"
  );
});

test("extracts and deduplicates PTMD caption tracks", () => {
  assert.deepEqual(subtitleTracksFromPtmd({captions:[
    {language:"deu",uri:"https://cdn.example/sub.xml"},
    {language:"deu",uri:"https://cdn.example/sub.xml"},
    {language:"eng",uri:"https://cdn.example/en.xml"},
  ]}),[
    {language:"deu",url:"https://cdn.example/sub.xml"},
    {language:"eng",url:"https://cdn.example/en.xml"},
  ]);
});

test("parses TTML clock and offset times into milliseconds", () => {
  assert.equal(parseClock("00:01:02.500"), 62500);
  assert.equal(parseClock("00:00:03,250"), 3250);
  assert.equal(parseClock("2.5s"), 2500);
  assert.equal(parseClock("125ms"), 125);
  assert.equal(parseClock("bad"), null);
});
