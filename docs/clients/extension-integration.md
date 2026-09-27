# Chrome Extension Integration

Existing repository: `mbkurt06/german-language-extension`.

Migration path:

1. Keep current YouTube subtitle acquisition and hover UX.
2. Replace direct engine calls with `POST /api/v1/analyze-and-match`.
3. Replace `chrome.storage.sync.learningItems` as source of truth with Platform API.
4. Keep a small local cache for latency/offline tolerance.
5. Add a generic web-text adapter that analyzes visible text blocks and decorates learned items.
6. Keep media-specific extraction in adapters (YouTube first; ZDF/ARD/ARTE and streaming sites can follow).
7. Add a streaming-site adapter contract for Netflix and similar browser players. The adapter detects the active title, visible subtitle/caption text, timing when safely observable, and maps it into the same Platform API analysis/encounter model.
8. Do not access, decrypt, download, proxy or modify DRM-protected video streams. The extension works only with page-visible metadata/subtitle surfaces and its own overlay UI.
9. Maintain a generic fallback adapter for streaming pages so a new site can be added with selectors/parsers and capability declarations rather than changes to Learning Core.

The extension must never contain German-specific learning logic. German behavior comes from the configured language engine.

## Streaming browser flow

```text
Netflix / other streaming page
          |
   Site Adapter
          |
visible subtitle/caption text
          |
Platform API / analyze-and-match
          |
learned-item matches
          |
Chrome overlay
  - subtle highlight
  - optional compact meaning
  - hover card
  - encounter recording
```

The same normalized learning item must match later on YouTube, a normal web article, Web App or Mobile App.
