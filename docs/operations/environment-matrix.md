# Environment Matrix

Date baseline: 2026-05-04

| Environment | INTERNAL_ACCESS_TOKEN | DB | RESEND_API_KEY | EMAIL_FROM | Notes |
|---|---|---|---|---|---|
| dev | Required | Required | Optional | Optional | Must pass `/api/internal/env-parity` |
| staging | Required | Required | Optional (required for email UAT) | Optional (required for email UAT) | Attach parity JSON to release ticket |
| production | Required | Required | Optional (required if email enabled) | Optional (required if email enabled) | Block release on missing required |

## Validation endpoint

- `/api/internal/env-parity`

## Runtime observability endpoints

- `/api/internal/sla-metrics`
- `/api/tickets/export?format=json` (authenticated)
