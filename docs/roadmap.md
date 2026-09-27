# Roadmap

## Platform-01 — shared learning core
- [x] Platform repository and API skeleton
- [x] PostgreSQL learning/encounter schema
- [x] language-engine registry
- [x] media-provider capability registry
- [x] web and mobile client skeletons
- [x] Docker Compose local runtime
- [x] Terraform VPS/Azure foundations
- [x] Ansible host bootstrap
- [x] Jenkins + GitHub Actions validation
- [ ] user/profile bootstrap API
- [ ] migrate Chrome learning state from chrome.storage to Platform API
- [ ] record encounters from YouTube
- [ ] show shared learning list in Web App

## Platform-02 — browser content
- [ ] viewport-aware web text adapter
- [ ] learned-item highlighting on arbitrary pages
- [ ] hover analysis via Platform API
- [ ] streaming-site adapter contract for browser players
- [ ] Netflix browser overlay prototype
- [ ] generic streaming subtitle adapter fallback
- [ ] encounter deduplication/rate limiting

## Platform-03 — media provider layer
- [ ] YouTube provider implementation
- [ ] ZDF adapter
- [ ] ARD adapter
- [ ] ARTE adapter
- [ ] Netflix browser adapter
- [ ] generic streaming provider adapter
- [ ] provider-specific subtitle/playback capability checks
- [ ] web media search/player

## Platform-04 — mobile learning
- [ ] authentication
- [ ] synchronized learning list
- [ ] encounters
- [ ] reviews and quizzes
- [ ] provider-aware playback/transcripts

## Later
- English/Spanish language engines
- spaced repetition
- listening index
- observability
- Redis/background jobs if justified
- managed Azure database/container services when migration from single VM becomes useful
