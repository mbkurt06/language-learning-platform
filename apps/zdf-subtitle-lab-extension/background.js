chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "zdf-lab-fetch-text") return false;

  const url = String(message.url || "");
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    sendResponse({ ok: false, error: "Invalid URL" });
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
    sendResponse({ ok: false, error: "Host not allowed: " + parsed.hostname });
    return false;
  }

  fetch(parsed.href, { credentials: "include" })
    .then(async response => {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.text();
    })
    .then(text => sendResponse({ ok: true, text }))
    .catch(error => sendResponse({ ok: false, error: String(error?.message || error) }));

  return true;
});
