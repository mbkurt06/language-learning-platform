const recentFetches = new Map();
const MIN_SAME_URL_INTERVAL_MS = 1200;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "zdf-lab-fetch-text") return false;

  const url = String(message.url || "");
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    sendResponse({ ok: false, error: "Invalid URL", status: 0, retryAfterMs: 0 });
    return false;
  }

  const allowed =
    parsed.protocol === "https:" &&
    (
      parsed.hostname === "www.zdf.de" ||
      parsed.hostname === "api.zdf.de" ||
      parsed.hostname === "utstreaming.zdf.de" ||
      parsed.hostname.endsWith(".akamaized.net")
    );

  if (!allowed) {
    sendResponse({
      ok: false,
      error: "Host not allowed: " + parsed.hostname,
      status: 0,
      retryAfterMs: 0
    });
    return false;
  }

  const now = Date.now();
  const lastFetchAt = recentFetches.get(parsed.href) || 0;
  const waitMs = Math.max(0, MIN_SAME_URL_INTERVAL_MS - (now - lastFetchAt));

  const runFetch = () => {
    recentFetches.set(parsed.href, Date.now());

    fetch(parsed.href, { credentials: "include", cache: "no-store" })
      .then(async response => {
        const retryAfterHeader = response.headers.get("retry-after");
        let retryAfterMs = 0;

        if (retryAfterHeader) {
          const numeric = Number(retryAfterHeader);
          if (Number.isFinite(numeric)) {
            retryAfterMs = Math.max(0, numeric * 1000);
          } else {
            const parsedDate = Date.parse(retryAfterHeader);
            if (!Number.isNaN(parsedDate)) {
              retryAfterMs = Math.max(0, parsedDate - Date.now());
            }
          }
        }

        if (!response.ok) {
          sendResponse({
            ok: false,
            error: "HTTP " + response.status,
            status: response.status,
            retryAfterMs
          });
          return;
        }

        const text = await response.text();
        sendResponse({ ok: true, text, status: response.status, retryAfterMs: 0 });
      })
      .catch(error => sendResponse({
        ok: false,
        error: String(error?.message || error),
        status: 0,
        retryAfterMs: 0
      }));
  };

  if (waitMs > 0) {
    setTimeout(runFetch, waitMs);
  } else {
    runFetch();
  }

  return true;
});
