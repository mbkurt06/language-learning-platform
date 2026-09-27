# ADR-001: Modular platform with external language engines

**Status:** Accepted

## Decision

Use a platform API as the only backend entry point for Chrome, web and mobile clients. Keep language engines and media providers behind explicit interfaces.

The first implementation is a modular monolith for Platform API plus separately deployable language engines. This avoids premature microservices while preserving boundaries that can later be split.

## Consequences

- Chrome will migrate away from direct `german-language-engine:8765` access.
- PostgreSQL becomes the source of truth for learning items and encounters.
- New languages are configured by engine registry rather than client changes.
- New media services are provider adapters, not special cases in learning logic.
- Local Docker Compose, VPS and Azure use the same containers and configuration contract.
