# Internal Auth Hardening

Date baseline: 2026-05-04

## Current controls

- Secure HTTP-only auth cookie.
- DB-backed failed-attempt rate limit (`5` failures / `15` minutes per requester IP).
- Role-aware authorization model using scoped tokens:
  - `administrator`
  - `manager`
  - `technician`
  - `finance`
- `401` is returned for unauthenticated requests; `403` is returned when role scope is insufficient.

## Token rotation SOP

1. Generate new role token(s) (`INTERNAL_ACCESS_TOKEN_ADMINISTRATOR` required; others optional).
2. Set new token(s) in target environment.
3. Validate with `/api/internal/env-parity`.
4. Log out active operator sessions.
5. Re-login with new token.
6. Confirm dashboard + API operations.

## Incident response

- On brute-force suspicion:
  - Inspect `auth_attempts` table.
  - Rotate token immediately.
  - Restrict affected IP ranges at edge/WAF layer.


