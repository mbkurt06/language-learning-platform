const test = require("node:test");
const assert = require("node:assert/strict");
const { zdfVideoId, isZdfVideoPage } = require("../src/zdf-provider.js");

test("extracts canonical id from current ZDF video URLs", () => {
  assert.equal(
    zdfVideoId("https://www.zdf.de/video/magazine/heute-journal-104/heute-journal-vom-27-september-2026-100"),
    "heute-journal-vom-27-september-2026-100"
  );
});

test("rejects non-video and non-ZDF URLs", () => {
  assert.equal(zdfVideoId("https://www.zdf.de/nachrichten"), "");
  assert.equal(zdfVideoId("https://example.com/video/test-100"), "");
  assert.equal(isZdfVideoPage("https://www.zdf.de/nachrichten"), false);
});
