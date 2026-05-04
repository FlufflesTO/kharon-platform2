# Alerting And Metrics

Date baseline: 2026-05-04

## SLA metrics endpoint

- Endpoint: `/api/internal/sla-metrics`
- Auth: same internal cookie auth as dashboard
- Returns:
  - total ticket count
  - breached ticket count
  - overdue open ticket count
  - created/resolved in last 24h
  - per-status counts

## Alert thresholds (recommended)

- Critical: `overdue_open > 0` for 15 minutes
- High: `breached / all >= 0.10`
- Medium: `created_last_24h > 0` and `resolved_last_24h = 0`

## Export audit monitoring

- `export_audit_log` should be reviewed daily for unusual volume or unknown requester IP ranges.
