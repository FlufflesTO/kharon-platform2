# Environment Matrix

Date baseline: 2026-05-05

| Environment | INTERNAL_ACCESS_TOKEN_ADMINISTRATOR | INTERNAL_ACCESS_TOKEN_MANAGER | INTERNAL_ACCESS_TOKEN_TECHNICIAN | INTERNAL_ACCESS_TOKEN_FINANCE | INTERNAL_ACCESS_TOKEN_CLIENT | DB | ARCHIVE_BUCKET | RESEND_API_KEY | EMAIL_FROM | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| production | Required | Optional | Optional | Optional | Optional | Required | Required | Optional (required if email enabled) | Optional (required if email enabled) | Block release on missing required and failed parity evidence |

## Validation endpoint

- `/api/internal/env-parity`

## Runtime observability endpoints

- `/api/internal/sla-metrics`
- `/api/tickets/export?format=json` (authenticated)

