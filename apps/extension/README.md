# German Language Extension

Chrome Manifest V3 client for the Language Learning Platform.

## Goal

Real subtitle testing on ZDF, ARD Mediathek and YouTube with the UX rule **context first, dictionary second**.

The extension is intentionally thin:

1. a site adapter observes visible subtitle text;
2. subtitle words become hover targets;
3. the full sentence is sent to Platform API;
4. Platform API routes the request to the configured language engine;
5. hover renders expression/chunk first, contextual meaning next, lexical/dictionary detail last.

## Local development

Start the complete platform stack from the repository root:

```bash
docker compose up --build
```

Then load `apps/extension` as an unpacked extension in Chrome.

The default Platform API endpoint is:

```text
http://127.0.0.1:8000
```

It can be changed in the extension options.

The extension no longer connects directly to `german-engine:8765`. The browser talks only to Platform API.

## Architecture

```text
Chrome Extension
      |
      v
Platform API :8000
      |
      v
German Engine :8765
      |
      v
LibreTranslate :5000
```

Platform-specific DOM handling stays in the extension. Linguistic analysis stays in `apps/german-engine`.


## Learning state

The extension resolves a German → Turkish learning profile through Platform API and treats PostgreSQL as the source of truth for the “Öğreniyorum” list.

On first run after migration, any legacy `chrome.storage.sync.learningItems` entries are copied to Platform API and then removed from Chrome sync storage. Chrome sync keeps only lightweight client configuration such as the API URL, client subject and resolved profile id.


## YouTube encounter capture

When a new word or expression is added to **Öğreniyorum** on YouTube, the extension also stores an encounter through Platform API with the subtitle sentence, video identity, source URL and cue start/end timestamps. The web app uses this data for source review and sentence-only playback.
