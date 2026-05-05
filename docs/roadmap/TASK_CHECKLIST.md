# Task Checklist

Last updated: 2026-05-05

## P0 Completed

- [x] Remove accidental root artifacts from git tracking.
- [x] Add internal dashboard status filter (all/open/assigned/in_progress/resolved/cancelled).
- [x] Add internal dashboard API error handling and operator-facing failure messages.
- [x] Replace starter README with project documentation and align token name to `INTERNAL_ACCESS_TOKEN`.
- [x] Restore roadmap tracking documents under `docs/roadmap/`.

## P1 Completed

- [x] Migrate `src/content.config.ts` away from deprecated `z` usage.
- [x] Add API tests covering auth failure, transition validity, and event trail integrity.
- [x] Add CI job step for check + build + API smoke.

## P2 Completed

- [x] Add dashboard pagination/search for high ticket volume.
- [x] Add structured audit export endpoint for ticket events.
- [x] Add saved filter presets for technicians.
- [x] Add internal auth rate-limit hardening and rotation SOP.
- [x] Add SLA metrics endpoint and alerting policy docs.
- [x] Add retention and archival policy docs.
- [x] Add role-based authorization beyond shared internal token.
- [x] Add 403 authorization matrix tests.
- [x] Add migration verification gate to CI.

## Follow-on Backlog

- [ ] Add scheduled archival automation job and evidence trail.
- [ ] Add per-user identity (user accounts + session revocation) beyond role tokens.
