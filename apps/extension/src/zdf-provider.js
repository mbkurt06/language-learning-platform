(() => {
  const PLAYER_ID = "android_native_6";

  function normalizeZdfUrl(value) {
    try { return new URL(value, "https://www.zdf.de"); } catch (_error) { return null; }
  }

  function zdfVideoId(value) {
    const url = normalizeZdfUrl(value);
    if (!url || !/(^|\.)zdf\.de$/i.test(url.hostname)) return "";
    const parts = url.pathname.split("/").filter(Boolean);
    const videoIndex = parts.indexOf("video");
    if (videoIndex < 0 || videoIndex === parts.length - 1) return "";
    return decodeURIComponent(parts[parts.length - 1]);
  }

  function isZdfVideoPage(value) {
    return Boolean(zdfVideoId(value));
  }

  function expandPtmdTemplate(template) {
    if (!template) return "";
    try {
      return new URL(String(template).replace("{playerId}", PLAYER_ID), "https://api.zdf.de").href;
    } catch (_error) {
      return "";
    }
  }

  function subtitleTracksFromPtmd(ptmd) {
    const seen = new Set();
    const tracks = [];
    for (const caption of Array.isArray(ptmd?.captions) ? ptmd.captions : []) {
      const uri = caption?.uri;
      if (!uri || seen.has(uri)) continue;
      let url;
      try { url = new URL(uri, "https://api.zdf.de").href; } catch (_error) { continue; }
      seen.add(uri);
      tracks.push({language:caption.language || "deu", url});
    }
    return tracks;
  }

  function parseClock(value) {
    const raw = String(value || "").trim();
    const clock = raw.match(/^(\d+):(\d{2}):(\d{2})(?:[.,](\d+))?$/);
    if (clock) {
      const fraction = Number("0." + (clock[4] || "0"));
      return Math.round((Number(clock[1]) * 3600 + Number(clock[2]) * 60 + Number(clock[3]) + fraction) * 1000);
    }
    const offset = raw.match(/^(\d+(?:\.\d+)?)(ms|s)$/);
    if (!offset) return null;
    return Math.round(Number(offset[1]) * (offset[2] === "s" ? 1000 : 1));
  }

  function normalizeText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function parseTtmlCues(xmlText) {
    if (typeof DOMParser === "undefined") return [];
    const doc = new DOMParser().parseFromString(String(xmlText || ""), "application/xml");
    if (doc.querySelector("parsererror")) return [];
    return [...doc.getElementsByTagNameNS("*", "p")].map(node => {
      const startMs = parseClock(node.getAttribute("begin"));
      const endMs = parseClock(node.getAttribute("end"));
      const text = normalizeText(node.textContent);
      if (startMs === null || endMs === null || endMs <= startMs || !text) return null;
      return {startMs, endMs, text};
    }).filter(Boolean).map((cue, index) => ({...cue, index}));
  }

  const api = {
    zdfVideoId,
    isZdfVideoPage,
    expandPtmdTemplate,
    subtitleTracksFromPtmd,
    parseClock,
    parseTtmlCues,
  };
  globalThis.GLEZdfProvider = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
