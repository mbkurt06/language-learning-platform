(() => {
  const BRIDGE_SOURCE = "zdf-subtitle-lab-bridge";
  const BRIDGE_TYPE = "subtitle-candidates";
  const REQUEST_SOURCE = "zdf-subtitle-lab-content";
  const REQUEST_TYPE = "request-latest";

  const LIVE_REFRESH_MS = 6000;
  const LIVE_LOOKBACK_SECONDS = 90;
  const LIVE_MAX_SEGMENTS = 48;
  const SEGMENT_CACHE_LIMIT = 160;

  const state = {
    video: null,
    mode: "waiting",
    directUrls: [],
    playlistUrls: [],
    sourceUrl: "",
    cues: [],
    segmentCache: new Map(),
    lastRefreshAt: 0,
    latestSubtitleEpoch: 0,
    videoAnchorTime: NaN,
    programAnchorEpoch: NaN,
    seekableEnd: NaN,
    refreshBusy: false,
    lastError: "",
    lastCue: "",
    sourceDetectedAt: 0
  };

  const overlay = document.createElement("div");
  overlay.id = "zdf-subtitle-lab-overlay";
  document.documentElement.appendChild(overlay);

  const debug = document.createElement("div");
  debug.id = "zdf-subtitle-lab-debug";
  document.documentElement.appendChild(debug);

  function normalizeText(value) {
    return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  function parseTimestamp(value) {
    const parts = String(value || "").trim().replace(",", ".").split(":").map(Number);
    if (parts.some(Number.isNaN)) return NaN;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return NaN;
  }

  function parseWebVtt(text) {
    const blocks = String(text || "").replace(/^\uFEFF/, "").split(/\n\s*\n/);
    const cues = [];
    for (const block of blocks) {
      const lines = block.split("\n").map(line => line.trimEnd()).filter(Boolean);
      const timingIndex = lines.findIndex(line => line.includes("-->"));
      if (timingIndex < 0) continue;
      const timing = lines[timingIndex].split("-->");
      const start = parseTimestamp(timing[0]?.trim().split(/\s+/)[0]);
      const end = parseTimestamp(timing[1]?.trim().split(/\s+/)[0]);
      const cueText = normalizeText(lines.slice(timingIndex + 1).join(" "));
      if (Number.isFinite(start) && Number.isFinite(end) && end > start && cueText) {
        cues.push({ start, end, text: cueText });
      }
    }
    return cues;
  }

  function resolveUrl(value, base) {
    try { return new URL(String(value || ""), base).href; }
    catch { return ""; }
  }

  function parseHlsSegments(text, playlistUrl) {
    const segments = [];
    const lines = String(text || "").split(/\r?\n/);
    let programTime = NaN;
    let duration = NaN;

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      if (line.startsWith("#EXT-X-PROGRAM-DATE-TIME:")) {
        const parsed = Date.parse(line.slice("#EXT-X-PROGRAM-DATE-TIME:".length).trim());
        programTime = Number.isNaN(parsed) ? NaN : parsed / 1000;
        continue;
      }

      if (line.startsWith("#EXTINF:")) {
        duration = Number.parseFloat(line.slice("#EXTINF:".length).split(",")[0]);
        continue;
      }

      if (line.startsWith("#")) continue;

      if (Number.isFinite(programTime) && Number.isFinite(duration)) {
        const url = resolveUrl(line, playlistUrl);
        if (url) segments.push({ url, startEpoch: programTime, duration });
      }
      programTime = NaN;
      duration = NaN;
    }
    return segments;
  }

  async function fetchText(url) {
    const response = await chrome.runtime.sendMessage({ type: "zdf-lab-fetch-text", url });
    if (!response?.ok) throw new Error(response?.error || "Fetch failed");
    return response.text || "";
  }

  function findVideo() {
    const videos = [...document.querySelectorAll("video")];
    state.video = videos
      .filter(video => {
        const rect = video.getBoundingClientRect();
        return rect.width > 200 && rect.height > 120;
      })
      .sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return (br.width * br.height) - (ar.width * ar.height);
      })[0] || state.video;
    return state.video;
  }

  function getSeekableEnd() {
    const video = state.video;
    try {
      if (video?.seekable?.length) return video.seekable.end(video.seekable.length - 1);
    } catch {}
    return NaN;
  }

  function livePlaybackEpoch() {
    const video = state.video;
    if (!video) return NaN;
    const current = Number(video.currentTime);

    if (
      Number.isFinite(current) &&
      Number.isFinite(state.videoAnchorTime) &&
      Number.isFinite(state.programAnchorEpoch)
    ) {
      return state.programAnchorEpoch + (current - state.videoAnchorTime);
    }

    const seekableEnd = getSeekableEnd();
    if (
      Number.isFinite(state.latestSubtitleEpoch) &&
      Number.isFinite(current) &&
      Number.isFinite(seekableEnd)
    ) {
      return state.latestSubtitleEpoch - Math.max(0, seekableEnd - current);
    }

    return NaN;
  }

  function dedupeCues(cues) {
    const seen = new Set();
    return cues
      .filter(cue => Number.isFinite(cue.start) && Number.isFinite(cue.end) && cue.end > cue.start && cue.text)
      .filter(cue => {
        const key = cue.start + "|" + cue.end + "|" + cue.text;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.start - b.start || a.end - b.end);
  }

  async function loadDirectVtt() {
    for (const url of state.directUrls) {
      try {
        const text = await fetchText(url);
        const cues = parseWebVtt(text);
        if (cues.length) {
          state.mode = "vod-direct-vtt";
          state.cues = cues;
          state.lastError = "";
          return true;
        }
      } catch (error) {
        state.lastError = String(error?.message || error);
      }
    }
    return false;
  }

  async function refreshLivePlaylist(force = false) {
    if (state.refreshBusy || !state.playlistUrls.length) return;
    if (!force && Date.now() - state.lastRefreshAt < LIVE_REFRESH_MS) return;

    state.refreshBusy = true;
    try {
      for (const playlistUrl of state.playlistUrls) {
        const playlistText = await fetchText(playlistUrl);
        const segments = parseHlsSegments(playlistText, playlistUrl);
        if (!segments.length) continue;

        const latestEnd = segments.reduce((max, item) => Math.max(max, item.startEpoch + item.duration), 0);
        const video = findVideo();
        const current = Number(video?.currentTime);
        const seekableEnd = getSeekableEnd();
        const playbackEpoch = Number.isFinite(current) && Number.isFinite(seekableEnd)
          ? latestEnd - Math.max(0, seekableEnd - current)
          : latestEnd;

        let selected = segments.filter(segment =>
          segment.startEpoch + segment.duration >= playbackEpoch - LIVE_LOOKBACK_SECONDS / 2 &&
          segment.startEpoch <= playbackEpoch + LIVE_LOOKBACK_SECONDS / 2
        ).slice(-LIVE_MAX_SEGMENTS);

        if (!selected.length) {
          selected = segments
            .filter(segment => segment.startEpoch >= latestEnd - LIVE_LOOKBACK_SECONDS)
            .slice(-LIVE_MAX_SEGMENTS);
        }

        const merged = [];
        for (const segment of selected) {
          let mapped = state.segmentCache.get(segment.url);
          if (!mapped) {
            try {
              const segmentText = await fetchText(segment.url);
              mapped = parseWebVtt(segmentText).map(cue => ({
                start: segment.startEpoch + cue.start,
                end: segment.startEpoch + cue.end,
                text: cue.text
              }));
            } catch {
              mapped = [];
            }
            state.segmentCache.set(segment.url, mapped);
          }
          merged.push(...mapped);
        }

        while (state.segmentCache.size > SEGMENT_CACHE_LIMIT) {
          const firstKey = state.segmentCache.keys().next().value;
          state.segmentCache.delete(firstKey);
        }

        const cues = dedupeCues(merged);
        if (cues.length) {
          state.mode = "live-hls-webvtt";
          state.cues = cues;
          state.lastRefreshAt = Date.now();
          state.latestSubtitleEpoch = latestEnd;
          state.seekableEnd = seekableEnd;
          state.videoAnchorTime = current;
          state.programAnchorEpoch = playbackEpoch;
          state.lastError = "";
          return;
        }
      }
    } catch (error) {
      state.lastError = String(error?.message || error);
    } finally {
      state.refreshBusy = false;
    }
  }

  function currentCue() {
    const video = findVideo();
    if (!video || !state.cues.length) return null;

    const time = state.mode === "live-hls-webvtt"
      ? livePlaybackEpoch()
      : Number(video.currentTime);

    if (!Number.isFinite(time)) return null;
    return state.cues.find(cue => time >= cue.start && time < cue.end) || null;
  }

  function render() {
    const cue = currentCue();
    const text = cue?.text || "";
    if (text !== state.lastCue) {
      state.lastCue = text;
      overlay.textContent = text;
      overlay.style.display = text ? "block" : "none";
    }

    const now = Date.now();
    const refreshAge = state.lastRefreshAt ? ((now - state.lastRefreshAt) / 1000).toFixed(1) + "s" : "-";
    debug.innerHTML =
      "<strong>ZDF Subtitle Lab</strong>\n" +
      "Mode: " + state.mode + "\n" +
      "Video: " + (state.video ? "found" : "waiting") + "\n" +
      "Direct VTT: " + state.directUrls.length + "\n" +
      "HLS subtitle playlists: " + state.playlistUrls.length + "\n" +
      "Cues: " + state.cues.length + "\n" +
      "Last refresh: " + refreshAge + "\n" +
      "Source: " + (state.sourceUrl || "-") + "\n" +
      "Current cue: " + (text || "-") + "\n" +
      "Error: " + (state.lastError || "-");

    if (state.mode === "live-hls-webvtt") refreshLivePlaylist(false);
  }

  async function acceptCandidates(data) {
    if (!data || data.routeKey !== location.pathname + location.search) return;

    state.sourceDetectedAt = Date.now();
    state.sourceUrl = String(data.sourceUrl || state.sourceUrl || "");
    state.directUrls = [...new Set([...(data.subtitleUrls || []), ...state.directUrls].filter(Boolean))];
    state.playlistUrls = [...new Set([...(data.subtitlePlaylistUrls || []), ...state.playlistUrls].filter(Boolean))];

    if (state.playlistUrls.length) {
      await refreshLivePlaylist(true);
      if (state.mode === "live-hls-webvtt") return;
    }

    if (state.directUrls.length) await loadDirectVtt();
  }

  function scanInlineZdfSubtitleUrls() {
    const text = [...document.scripts].map(script => script.textContent || "").join("\n");
    const urls = [];
    const re = /https:\/\/utstreaming\.zdf\.de\/[^"'\s\\]+\.(?:vtt|xml)(?:\?[^"'\s\\]*)?/gi;
    for (const match of text.matchAll(re)) {
      urls.push(match[0].replace(/\.xml([?#].*)?$/i, ".vtt$1"));
    }
    if (urls.length) {
      acceptCandidates({
        routeKey: location.pathname + location.search,
        sourceUrl: "inline-page-data",
        subtitleUrls: urls,
        subtitlePlaylistUrls: []
      });
    }
  }

  window.addEventListener("message", event => {
    if (event.source !== window) return;
    const data = event.data;
    if (data?.source !== BRIDGE_SOURCE || data?.type !== BRIDGE_TYPE) return;
    acceptCandidates(data).catch(error => {
      state.lastError = String(error?.message || error);
    });
  });

  window.postMessage({ source: REQUEST_SOURCE, type: REQUEST_TYPE }, "*");
  scanInlineZdfSubtitleUrls();
  findVideo();

  setInterval(render, 160);
  setInterval(() => {
    findVideo();
    if (!state.directUrls.length && !state.playlistUrls.length) {
      window.postMessage({ source: REQUEST_SOURCE, type: REQUEST_TYPE }, "*");
      scanInlineZdfSubtitleUrls();
    }
  }, 2500);
})();
