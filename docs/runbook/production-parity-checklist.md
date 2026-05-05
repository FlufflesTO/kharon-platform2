# Production Parity Checklist

Date baseline: 2026-05-05

## Scope

Validate runtime parity for production runtime keys: `INTERNAL_ACCESS_TOKEN_ADMINISTRATOR`, `DB`, `ARCHIVE_BUCKET`, `RESEND_API_KEY`, and `EMAIL_FROM`.

## Steps

1. Log in to `/internal` in production.
2. Open `/api/internal/env-parity`.
3. Confirm `ready=true` and `missing_required=[]`.
4. If email notifications are expected, confirm `missing_optional=[]`.
5. Capture output JSON to `docs/evidence/production-env-parity.json` and attach it to the release ticket.

## Blocking criteria

- Any missing required key blocks release.
- Missing optional keys block release only when email flows are in scope.

## Post-check smoke

1. `POST /api/triage` with a test payload.
2. Confirm the ticket appears in `/internal`.
3. Run `/api/tickets/export?format=json` and verify ticket + event visibility.
4. Run `/api/internal/sla-metrics` and verify counters return.
5. Run `POST /api/internal/maintenance/archive-monthly` and verify `archive_key` is returned.

## Rollback trigger

Rollback release if parity breaks after deploy (required key missing) or if API smoke returns non-2xx.


## Automation helpers

- scripts/ops/apply-remote-migrations.ps1 applies remote D1 migrations (requires CLOUDFLARE_API_TOKEN).
- scripts/ops/verify-live-parity.ps1 logs in and checks /api/internal/env-parity + /api/internal/sla-metrics.
- scripts/ops/verify-release-evidence.mjs validates committed parity/smoke evidence JSON files when `REQUIRE_RELEASE_EVIDENCE=true`.

