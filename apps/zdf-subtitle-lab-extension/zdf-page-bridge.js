(() => {
  const INSTALLED = "__ZDF_SUBTITLE_LAB_BRIDGE__";
  if (window[INSTALLED]) return;
  window[INSTALLED] = true;

  const SOURCE = "zdf-subtitle-lab-bridge";
  const TYPE = "subtitle-candidates";
  const REQUEST_SOURCE = "zdf-subtitle-lab-content";
  const REQUEST_TYPE = "request-latest";
  const MAX_CAPTURE_BYTES = 5_000_000;

  let latest = null;

  const routeKey = () => location.pathname + location.search;

  function absoluteUrl(value, base = location.href) {
    try {
      return new URL(String(value || ""), base).href;
    } catch {
      return "";
    }
  }

  function normalizeSubtitleUrl(url) {
    return String(url || "").trim().replace(/\.xml([?#].*)?$/i, ".vtt$1");
  }

  function isDirectSubtitleUrl(url) {
    return /^https:\/\/utstreaming\.zdf\.de\/.+\.(?:vtt|xml)(?:[?#].*)?$/i.test(url);
  }

  function isZdfHlsUrl(url) {
    try {
      const parsed = new URL(url, location.href);
      return parsed.protocol === "https:" &&
        parsed.hostname.endsWith(".akamaized.net") &&
        /\.m3u8(?:[?#]|$)/i.test(parsed.pathname + parsed.search);
    } catch {
      return false;
    }
  }

  function parseAttributeList(value) {
    const out = {};
    const input = String(value || "");
    let index = 0;
    while (index < input.length) {
      const match = input.slice(index).match(/^\s*([A-Z0-9-]+)=/i);
      if (!match) break;
      const key = match[1].toUpperCase();
      index += match[0].length;
      let val = "";
      if (input[index] === '"') {
        index += 1;
        const start = index;
        while (index < input.length && input[index] !== '"') index += 1;
        val = input.slice(start, index);
        index += 1;
      } else {
        const start = index;
        while (index < input.length && input[index] !== ",") index += 1;
        val = input.slice(start, index).trim();
      }
      out[key] = val;
      if (input[index] === ",") index += 1;
    }
    return out;
  }

  function collectDirectUrls(text, sourceUrl) {
    const found = [];
    const seen = new Set();
    const input = String(text || "");

    const re = /https:\/\/utstreaming\.zdf\.de\/[^"'\s\\]+\.(?:vtt|xml)(?:\?[^"'\s\\]*)?/gi;
    for (const match of input.matchAll(re)) {
      const normalized = normalizeSubtitleUrl(match[0]);
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        found.push(normalized);
      }
    }

    if (isDirectSubtitleUrl(sourceUrl)) {
      const normalized = normalizeSubtitleUrl(sourceUrl);
      if (!seen.has(normalized)) found.push(normalized);
    }
    return found;
  }

  function collectSubtitlePlaylists(text, sourceUrl) {
    const found = [];
    const seen = new Set();
    const lines = String(text || "").split(/\r?\n/);

    for (const line of lines) {
      if (!line.startsWith("#EXT-X-MEDIA:")) continue;
      const attrs = parseAttributeList(line.slice("#EXT-X-MEDIA:".length));
      if (String(attrs.TYPE || "").toUpperCase() !== "SUBTITLES" || !attrs.URI) continue;
      const url = absoluteUrl(attrs.URI, sourceUrl);
      if (url && !seen.has(url)) {
        seen.add(url);
        found.push(url);
      }
    }

    if (isZdfHlsUrl(sourceUrl) && /WEBVTT|#EXT-X-PROGRAM-DATE-TIME|#EXTINF:/i.test(String(text || ""))) {
      if (!seen.has(sourceUrl)) found.push(sourceUrl);
    }

    return found;
  }

  function publish(directUrls, playlistUrls, sourceUrl) {
    const direct = [...new Set(directUrls.filter(Boolean))];
    const playlists = [...new Set(playlistUrls.filter(Boolean))];
    if (!direct.length && !playlists.length) return;

    latest = {
      source: SOURCE,
      type: TYPE,
      routeKey: routeKey(),
      sourceUrl,
      subtitleUrls: direct,
      subtitlePlaylistUrls: playlists,
      capturedAt: Date.now()
    };
    window.postMessage(latest, "*");
  }

  function shouldInspectResponse(url, contentType = "") {
    const type = String(contentType || "").toLowerCase();
    return (
      url.includes("/ptmd/") ||
      url.includes("utstreaming.zdf.de") ||
      /\.m3u8(?:[?#]|$)/i.test(url) ||
      (url.includes("api.zdf.de") && type.includes("json"))
    );
  }

  function inspectResponse(url, text, contentType = "") {
    if (!shouldInspectResponse(url, contentType)) return;
    if (!text || text.length > MAX_CAPTURE_BYTES) return;

    const direct = collectDirectUrls(text, url);
    const playlists = collectSubtitlePlaylists(text, url);
    publish(direct, playlists, url);
  }

  window.addEventListener("message", event => {
    if (event.source !== window) return;
    const data = event.data;
    if (data?.source !== REQUEST_SOURCE || data?.type !== REQUEST_TYPE || !latest) return;
    window.postMessage({ ...latest, routeKey: routeKey() }, "*");
  });

  if (typeof window.fetch === "function") {
    const nativeFetch = window.fetch;
    window.fetch = function(...args) {
      return nativeFetch.apply(this, args).then(response => {
        try {
          const url = absoluteUrl(args[0]?.url || args[0]) || response.url || "";
          const contentType = response.headers?.get("content-type") || "";
          if (shouldInspectResponse(url, contentType)) {
            response.clone().text().then(text => inspectResponse(url, text, contentType)).catch(() => {});
          }
        } catch {}
        return response;
      });
    };
  }

  if (window.XMLHttpRequest?.prototype) {
    const nativeOpen = XMLHttpRequest.prototype.open;
    const nativeSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this.__zdfLabUrl = absoluteUrl(url);
      return nativeOpen.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      this.addEventListener("loadend", () => {
        try {
          const url = this.__zdfLabUrl || "";
          const contentType = this.getResponseHeader?.("content-type") || "";
          if (!shouldInspectResponse(url, contentType)) return;
          let text = "";
          if (!this.responseType || this.responseType === "text") text = this.responseText || "";
          else if (this.responseType === "json") text = JSON.stringify(this.response || null);
          inspectResponse(url, text, contentType);
        } catch {}
      });
      return nativeSend.apply(this, args);
    };
  }
})();
