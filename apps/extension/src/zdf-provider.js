(() => {
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

  const api = { zdfVideoId, isZdfVideoPage };
  globalThis.GLEZdfProvider = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
