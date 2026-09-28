(() => {
  const PLAYER_ID = "android_native_6";
  const TOKEN_URL = "https://zdf-prod-futura.zdf.de/mediathekV2/token";
  const GRAPHQL_URL = "https://api.zdf.de/graphql";

  function normalizeZdfUrl(value) {
    try { return new URL(value, "https://www.zdf.de"); } catch (_error) { return null; }
  }

  function zdfVideoId(value) {
    const url = normalizeZdfUrl(value);
    if (!url || !/(^|\.)zdf\.de$/i.test(url.hostname)) return "";
    const parts = url.pathname.split("/").filter(Boolean);
    const routeIndex = parts.findIndex(part => part === "video" || part === "play");
    if (routeIndex < 0 || routeIndex === parts.length - 1) return "";
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

  function apiAuthorization(tokenPayload) {
    const type = String(tokenPayload?.type || "").trim();
    const token = String(tokenPayload?.token || "").trim();
    return type && token ? `${type} ${token}` : "";
  }

  function videoMetadataRequest(canonical, authorization) {
    return {
      url: GRAPHQL_URL,
      options: {
        method: "POST",
        headers: {
          "Api-Auth": authorization,
          "Apollo-Require-Preflight": "true",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operationName: "VideoByCanonical",
          query: "query VideoByCanonical($canonical: String!) { videoByCanonical(canonical: $canonical) { canonical title currentMedia { nodes { ptmdTemplate } } } }",
          variables: {canonical},
        }),
      },
    };
  }

  function ptmdTemplatesFromMetadata(payload) {
    const nodes = payload?.data?.videoByCanonical?.currentMedia?.nodes;
    if (!Array.isArray(nodes)) return [];
    return [...new Set(nodes.map(node => expandPtmdTemplate(node?.ptmdTemplate)).filter(Boolean))];
  }

  async function discoverSubtitleTracks(canonical, fetchImpl = fetch) {
    if (!canonical) throw new Error("missing-zdf-canonical");
    let tokenResponse;
    try { tokenResponse = await fetchImpl(TOKEN_URL, {cache:"no-store"}); }
    catch (error) { throw new Error("zdf-token-fetch: "+String(error?.message||error)); }
    if (!tokenResponse.ok) throw new Error(`zdf-token-http-${tokenResponse.status}`);
    const authorization = apiAuthorization(await tokenResponse.json());
    if (!authorization) throw new Error("invalid-zdf-token");

    const metadataRequest = videoMetadataRequest(canonical, authorization);
    let metadataResponse;
    try { metadataResponse = await fetchImpl(metadataRequest.url, metadataRequest.options); }
    catch (error) { throw new Error("zdf-metadata-fetch: "+String(error?.message||error)); }
    if (!metadataResponse.ok) throw new Error(`zdf-metadata-http-${metadataResponse.status}`);
    const ptmdUrls = ptmdTemplatesFromMetadata(await metadataResponse.json());
    if (!ptmdUrls.length) throw new Error("missing-zdf-ptmd");

    const tracks = [];
    const seen = new Set();
    for (const ptmdUrl of ptmdUrls) {
      let response;
      try { response = await fetchImpl(ptmdUrl, {headers:{"Api-Auth":authorization}, cache:"no-store"}); }
      catch (error) { throw new Error("zdf-ptmd-fetch: "+String(error?.message||error)); }
      if (!response.ok) continue;
      for (const track of subtitleTracksFromPtmd(await response.json())) {
        if (seen.has(track.url)) continue;
        seen.add(track.url);
        tracks.push(track);
      }
    }
    return tracks;
  }

  const api = {
    zdfVideoId,
    isZdfVideoPage,
    expandPtmdTemplate,
    subtitleTracksFromPtmd,
    parseClock,
    parseTtmlCues,
    apiAuthorization,
    videoMetadataRequest,
    ptmdTemplatesFromMetadata,
    discoverSubtitleTracks,
  };
  globalThis.GLEZdfProvider = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
