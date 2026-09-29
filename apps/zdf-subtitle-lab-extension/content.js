(() => {
  const BRIDGE_SOURCE = "zdf-subtitle-lab-bridge";
  const BRIDGE_TYPE = "subtitle-candidates";
  const REQUEST_SOURCE = "zdf-subtitle-lab-content";
  const REQUEST_TYPE = "request-latest";

  const LIVE_REFRESH_MS = 15000;
  const CANDIDATE_REFRESH_DEBOUNCE_MS = 8000;
  const RETRY_BACKOFF_STEPS_MS = [15000, 30000, 60000, 120000, 300000];
  const LIVE_LOOKBACK_SECONDS = 30;
  const LIVE_MAX_SEGMENTS = 8;
  const SEGMENT_CACHE_LIMIT = 48;
  const DEBUG_EVENT_LIMIT = 600;
  const DEBUG_STORAGE_KEY = "zdfSubtitleLabDebugSession";

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
    sourceDetectedAt: 0,
    lastAttemptAt: 0,
    nextAllowedRefreshAt: 0,
    consecutiveRefreshFailures: 0,
    candidateRefreshTimer: null,
    cooldownReason: "",
    activePlaylistUrl: "",
    debugEvents: [],
    debugSessionId: new Date().toISOString(),
    debugPersistTimer: null
  };

  const host = document.createElement("div");
  host.id = "zdf-subtitle-lab-host";
  host.style.setProperty("all", "initial", "important");
  host.style.setProperty("position", "fixed", "important");
  host.style.setProperty("inset", "0", "important");
  host.style.setProperty("z-index", "2147483647", "important");
  host.style.setProperty("pointer-events", "none", "important");

  const shadow = host.attachShadow({ mode: "open" });
  const shadowStyle = document.createElement("style");
  shadowStyle.textContent = `
    :host {
      all: initial;
      position: fixed !important;
      inset: 0 !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
    }

    *, *::before, *::after { box-sizing: border-box; }

    #overlay {
      all: initial;
      position: fixed;
      left: 50%;
      bottom: 13%;
      transform: translateX(-50%);
      z-index: 2147483646;
      max-width: min(82vw, 1100px);
      padding: 9px 15px;
      border-radius: 10px;
      background: rgba(0, 0, 0, .82);
      color: #fff;
      font: 600 clamp(18px, 2vw, 30px)/1.25 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      text-align: center;
      white-space: normal;
      pointer-events: none;
      display: none;
    }

    #debug {
      all: initial;
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 2147483647;
      width: min(380px, calc(100vw - 24px));
      padding: 12px;
      border-radius: 10px;
      background: rgba(12, 16, 24, .96);
      color: #dbeafe;
      box-shadow: 0 12px 30px rgba(0,0,0,.32);
      font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      pointer-events: none;
    }
  `;

  const overlay = document.createElement("div");
  overlay.id = "overlay";

  const debug = document.createElement("pre");
  debug.id = "debug";

  shadow.append(shadowStyle, overlay, debug);
  (document.documentElement || document.body).appendChild(host);

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
    if (!response?.ok) {
      const error = new Error(response?.error || "Fetch failed");
      error.status = Number(response?.status) || 0;
      error.retryAfterMs = Number(response?.retryAfterMs) || 0;
      throw error;
    }
    return response.text || "";
  }

  function registerRefreshFailure(error) {
    state.consecutiveRefreshFailures += 1;
    const step = RETRY_BACKOFF_STEPS_MS[
      Math.min(state.consecutiveRefreshFailures - 1, RETRY_BACKOFF_STEPS_MS.length - 1)
    ];
    const retryAfterMs = Number(error?.retryAfterMs) || 0;
    const backoffMs = Math.max(step, retryAfterMs);
    state.nextAllowedRefreshAt = Date.now() + backoffMs;
    state.cooldownReason = error?.status === 429
      ? "HTTP 429 / rate limit"
      : "refresh backoff";
    state.lastError = String(error?.message || error);
  }

  function registerRefreshSuccess() {
    state.consecutiveRefreshFailures = 0;
    state.nextAllowedRefreshAt = 0;
    state.cooldownReason = "";
    state.lastError = "";
  }

  function refreshCooldownRemainingMs() {
    return Math.max(0, state.nextAllowedRefreshAt - Date.now());
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
    const now = Date.now();
    const cooldownMs = refreshCooldownRemainingMs();
    if (cooldownMs > 0) return;
    if (now - state.lastAttemptAt < LIVE_REFRESH_MS) return;
    if (!force && now - state.lastRefreshAt < LIVE_REFRESH_MS) return;

    state.lastAttemptAt = now;
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
          registerRefreshSuccess();
          return;
        }
      }
      registerRefreshFailure(new Error("No usable live subtitle cues found"));
    } catch (error) {
      registerRefreshFailure(error);
    } finally {
      state.refreshBusy = false;
    }
  }

  function currentPlaybackTime() {
    const video = findVideo();
    if (!video) return NaN;
    return state.mode === "live-hls-webvtt"
      ? livePlaybackEpoch()
      : Number(video.currentTime);
  }

  function currentCue() {
    const time = currentPlaybackTime();
    if (!Number.isFinite(time) || !state.cues.length) return null;
    return state.cues.find(cue => time >= cue.start && time < cue.end) || null;
  }

  function formatTime(value) {
    return Number.isFinite(value) ? value.toFixed(3) : "-";
  }

  function render() {
    const playbackTime = currentPlaybackTime();
    const cue = currentCue();
    const text = cue?.text || "";
    if (text !== state.lastCue) {
      state.lastCue = text;
      overlay.textContent = text;
      overlay.style.display = text ? "block" : "none";
    }

    const now = Date.now();
    const refreshAge = state.lastRefreshAt ? ((now - state.lastRefreshAt) / 1000).toFixed(1) + "s" : "-";
    const cooldownMs = refreshCooldownRemainingMs();
    const cooldownText = cooldownMs > 0 ? (cooldownMs / 1000).toFixed(1) + "s" : "-";
    const cueDelta = cue && Number.isFinite(playbackTime) ? playbackTime - cue.start : NaN;

    debug.textContent =
      "ZDF Subtitle Lab\n" +
      "Mode: " + state.mode + "\n" +
      "Video: " + (state.video ? "found" : "waiting") + "\n" +
      "Direct VTT: " + state.directUrls.length + "\n" +
      "HLS subtitle playlists: " + state.playlistUrls.length + "\n" +
      "Cues: " + state.cues.length + "\n" +
      "Last refresh: " + refreshAge + "\n" +
      "Refresh interval: " + (LIVE_REFRESH_MS / 1000) + "s\n" +
      "Cooldown: " + cooldownText + (state.cooldownReason ? " (" + state.cooldownReason + ")" : "") + "\n" +
      "Refresh failures: " + state.consecutiveRefreshFailures + "\n" +
      "Playback time: " + formatTime(playbackTime) + "\n" +
      "Cue start: " + formatTime(cue?.start) + "\n" +
      "Cue end: " + formatTime(cue?.end) + "\n" +
      "Cue delta: " + formatTime(cueDelta) + "\n" +
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
      if (!state.candidateRefreshTimer) {
        state.candidateRefreshTimer = window.setTimeout(() => {
          state.candidateRefreshTimer = null;
          refreshLivePlaylist(false).catch(error => {
            registerRefreshFailure(error);
          });
        }, CANDIDATE_REFRESH_DEBOUNCE_MS);
      }
      return;
    }

    if (state.directUrls.length && state.mode !== "vod-direct-vtt") await loadDirectVtt();
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
  }, 10000);
})();
