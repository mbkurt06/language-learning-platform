# Target Architecture

The platform is designed around stable platform contracts and replaceable language/media modules.

```text
Chrome Extension       Web App        Mobile App
        \                 |               /
                 Platform API
                      |
      +---------------+----------------+
      |               |                |
 Learning Core   Analysis Service   Media Service
      |               |                |
 PostgreSQL      Language Engines   Provider Adapters
                      |                |
                 DE / EN / ES    YouTube/ZDF/ARD/ARTE/Netflix/...
```

## Boundaries

- **Platform Core** owns users, learning profiles, learning items, encounters, reviews, progress and synchronization.
- **Language Engines** own language-specific morphology, lemma resolution, structural phrase recognition and grammar metadata.
- **Translation Layer** is separate from language analysis. A canonical German item can have Turkish, English or other translations.
- **Media Providers** expose capability-based adapters. YouTube is the first provider, not a platform assumption.
- **Clients** never connect directly to PostgreSQL, translation services or language engines. They call Platform API.

## Learning identity

A learning item is normalized and stable:

- `gehen` is one learning item even when the surface form is `ging`, `geht` or `gegangen`.
- `sich vertun` is one learning item even when its members are split across a sentence.
- Encounter records preserve the real surface form, sentence, provider and optional media timestamp.

## Provider model

A provider declares capabilities independently:

- search
- metadata
- playback
- subtitles
- browser_overlay

This allows German providers such as ZDF/ARD, French providers, and browser-only streaming integrations such as Netflix to be added without modifying Learning Core. `browser_overlay` means the Chrome extension can observe user-visible subtitle/text surfaces and render learning UI on top of the page without becoming responsible for the protected video stream itself.

Provider adapters must respect each service's public APIs, embedding rules, DRM and terms; unsupported capabilities remain absent. DRM-protected media is never downloaded, decrypted, proxied or re-hosted by the platform.

## Deployment

The same application images and environment variables are used locally, on a VPS and later on Azure.
Infrastructure code changes the runtime target, not application behavior.
