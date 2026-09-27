# Language Learning Platform

A multi-client, multi-language learning platform that turns real-world content into synchronized learning material.

The first vertical slice is German → Turkish with the existing Chrome extension and German Language Engine. The platform itself is intentionally language- and provider-neutral.

## Clients

- Chrome Extension — YouTube first, then general web text and provider-specific integrations.
- Web App — learning list, encounters, media discovery, review and statistics.
- Mobile App — synchronized learning, media/transcript UX and quizzes.

## Core services

- Platform API — the only backend entry point for clients.
- PostgreSQL — source of truth for users, learning profiles, learning items and encounters.
- Language Engine Registry — routes analysis by source language.
- German Language Engine — German linguistic analysis service managed inside this monorepo.
- LibreTranslate — translation service used by the German engine.
- Media Provider Registry — capability-based providers such as YouTube, ZDF, ARD and ARTE.

## Local quick start

```bash
cp .env.example .env
docker compose up --build
```

The Compose stack starts:

- PostgreSQL
- LibreTranslate
- German Language Engine
- Platform API
- Web App

Open:

- Web: http://localhost:3001
- API docs: http://localhost:8000/docs
- API health: http://localhost:8000/health
- German Engine health: http://localhost:8765/health
- LibreTranslate diagnostics: http://localhost:5001/languages

Internal service routing uses Compose DNS:

```text
Platform API -> http://german-engine:8765
German Engine -> http://translation:5000
```

No separately started local German engine is required.

## First platform milestone

1. Create a user and a German → Turkish learning profile.
2. Chrome sends text to `POST /api/v1/analyze-and-match`.
3. Platform API routes German analysis to the German Engine.
4. German Engine normalizes words/expressions and uses LibreTranslate for Turkish meaning data.
5. Learning items are stored centrally in PostgreSQL.
6. Learned items are matched by lemma/structural canonical key across clients.
7. Encounters store the real source, sentence, surface form and media timestamp.
8. Web and mobile read the same learning state.

## Infrastructure

- Docker Compose for local/VPS runtime.
- Terraform foundations for an existing VPS workflow and Azure Linux VM deployment.
- Ansible for host bootstrap/deployment.
- GitHub Actions for pull-request validation.
- Jenkinsfile for a production-oriented, approval-gated pipeline.

See:

- `docs/architecture/overview.md`
- `docs/architecture/adr-001-modular-platform.md`
- `docs/infrastructure/deployment.md`
- `docs/roadmap.md`

## Migrated repositories

The current German Engine source was migrated from `mbkurt06/german-language-engine` into `apps/german-engine`.

The Chrome extension was migrated from `mbkurt06/german-language-extension` into `apps/extension`.

The target architecture is one product repository: clients call Platform API rather than language engines directly. Chrome learning items are now stored through Platform API in PostgreSQL; `chrome.storage.sync` is retained only for lightweight client configuration/identity and one-time migration metadata.
