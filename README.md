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
- Media Provider Registry — capability-based providers such as YouTube, ZDF, ARD and ARTE.
- Translation remains separate from language analysis.

## Local quick start

Keep the current German engine running locally on port 8765, then:

```bash
cp .env.example .env
docker compose up --build
```

Open:

- Web: http://localhost:3000
- API docs: http://localhost:8000/docs
- API health: http://localhost:8000/health

The default local configuration reaches the German engine through `host.docker.internal:8765`.

## First platform milestone

1. Create a user and a German → Turkish learning profile.
2. Chrome sends text to `POST /api/v1/analyze-and-match`.
3. German Engine normalizes words/expressions.
4. Learning items are stored centrally in PostgreSQL.
5. Learned items are matched by lemma/structural canonical key across clients.
6. Encounters store the real source, sentence, surface form and media timestamp.
7. Web and mobile read the same learning state.

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

## Existing related repositories

- `mbkurt06/german-language-engine`
- `mbkurt06/german-language-extension`

The extension will migrate from direct engine access and `chrome.storage.sync` to Platform API without throwing away the existing YouTube subtitle work.
