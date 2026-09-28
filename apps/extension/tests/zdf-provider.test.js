const test = require("node:test");
const assert = require("node:assert/strict");
const { zdfVideoId, isZdfVideoPage, expandPtmdTemplate, subtitleTracksFromPtmd, parseClock, apiAuthorization, videoMetadataRequest, ptmdTemplatesFromMetadata, discoverSubtitleTracks } = require("../src/zdf-provider.js");

test("extracts canonical id from current ZDF video URLs", () => {
  assert.equal(zdfVideoId("https://www.zdf.de/video/magazine/heute-journal-104/heute-journal-vom-27-september-2026-100"), "heute-journal-vom-27-september-2026-100");
});

test("extracts canonical id from ZDF play URLs", () => {
  assert.equal(
    zdfVideoId("https://www.zdf.de/play/animation/die-biene-maja-110/die-grosse-weite-wiesenwelt-102"),
    "die-grosse-weite-wiesenwelt-102"
  );
  assert.equal(isZdfVideoPage("https://www.zdf.de/play/animation/die-biene-maja-110/die-grosse-weite-wiesenwelt-102"), true);
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


test("builds API authorization from the runtime token response", () => {
  assert.equal(apiAuthorization({type:"Bearer",token:"abc"}), "Bearer abc");
  assert.equal(apiAuthorization({type:"Bearer"}), "");
});

test("builds GraphQL metadata request and extracts PTMD templates", () => {
  const request = videoMetadataRequest("example-100", "Bearer abc");
  assert.equal(request.url, "https://api.zdf.de/graphql");
  assert.equal(request.options.headers["Api-Auth"], "Bearer abc");
  assert.equal(JSON.parse(request.options.body).variables.canonical, "example-100");
  assert.deepEqual(ptmdTemplatesFromMetadata({data:{videoByCanonical:{currentMedia:{nodes:[
    {ptmdTemplate:"/tmd/2/{playerId}/vod/ptmd/mediathek/example/3"},
  ]}}}}), ["https://api.zdf.de/tmd/2/android_native_6/vod/ptmd/mediathek/example/3"]);
});

test("discovers and deduplicates subtitle tracks across PTMD documents", async () => {
  const responses = [
    {ok:true,json:async()=>({type:"Bearer",token:"abc"})},
    {ok:true,json:async()=>({data:{videoByCanonical:{currentMedia:{nodes:[
      {ptmdTemplate:"/ptmd/one/{playerId}"},
      {ptmdTemplate:"/ptmd/two/{playerId}"},
    ]}}}})},
    {ok:true,json:async()=>({captions:[{language:"deu",uri:"https://cdn.example/de.xml"}]})},
    {ok:true,json:async()=>({captions:[
      {language:"deu",uri:"https://cdn.example/de.xml"},
      {language:"eng",uri:"https://cdn.example/en.xml"},
    ]})},
  ];
  const calls = [];
  const fakeFetch = async (url, options={}) => {
    calls.push({url,options});
    return responses.shift();
  };
  const tracks = await discoverSubtitleTracks("example-100", fakeFetch);
  assert.deepEqual(tracks, [
    {language:"deu",url:"https://cdn.example/de.xml"},
    {language:"eng",url:"https://cdn.example/en.xml"},
  ]);
  assert.equal(calls[1].options.headers["Api-Auth"], "Bearer abc");
  assert.equal(calls[2].options.headers["Api-Auth"], "Bearer abc");
});
