# Chrome Extension Integration

Existing repository: `mbkurt06/german-language-extension`.

Migration path:

1. Keep current YouTube subtitle acquisition and hover UX.
2. Replace direct engine calls with `POST /api/v1/analyze-and-match`.
3. Replace `chrome.storage.sync.learningItems` as source of truth with Platform API.
4. Keep a small local cache for latency/offline tolerance.
5. Add a generic web-text adapter that analyzes visible text blocks and decorates learned items.
6. Keep media-specific extraction in adapters (YouTube first; ZDF/ARD/ARTE can follow).

The extension must never contain German-specific learning logic. German behavior comes from the configured language engine.
