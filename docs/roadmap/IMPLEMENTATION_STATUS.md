# Implementation Status

Last updated: 2026-05-05

## Current State

- Core Astro + Cloudflare D1 ticketing platform builds and deploy artifacts generate successfully.
- Internal dashboard supports status filtering, server-side query pagination, search, preset save/load, SLA refresh, status transitions, assignment, and proof view.
- Internal dashboard surfaces API failures instead of silently reloading.
- API contract tests and API smoke checks are wired in CI.
- Authenticated audit export endpoint supports `json|csv` with optional `ticket_id`, `status`, `from`, and `to` filters.
- Export access events are logged to `export_audit_log`.
- Authenticated env parity endpoint is available at `/api/internal/env-parity`.
- Authenticated SLA metrics endpoint is available at `/api/internal/sla-metrics`.
- Login hardening includes DB-backed failed-attempt rate limiting (`5` attempts in `15` minutes by requester IP).
- Role-based authorization is enforced across internal endpoints (`administrator`, `manager`, `technician`, `finance`, `client`) with explicit `403` on insufficient scope.

## Operational Artifacts Added

- `docs/runbook/production-parity-checklist.md`
- `docs/operations/environment-matrix.md`
- `docs/operations/alerting-and-metrics.md`
- `docs/operations/data-retention-archival.md`
- `docs/security/internal-auth-hardening.md`

## Open Workstreams

- Execute parity validation in each deployed environment and attach evidence to release records.
- Apply new D1 migrations for `auth_attempts` and `export_audit_log` in all environments.
- Schedule recurring archival automation with immutable evidence records.

## Risks

- Remaining risk is deployment configuration drift or missing migrations rather than app-code behavior.

