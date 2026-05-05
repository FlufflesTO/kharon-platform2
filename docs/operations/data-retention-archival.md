# Data Retention And Archival

Date baseline: 2026-05-04

## Tables

- `tickets`
- `ticket_events`
- `export_audit_log`
- `auth_attempts`

## Retention policy

- `auth_attempts`: retain 30 days.
- `export_audit_log`: retain 180 days.
- `ticket_events`: retain 24 months minimum.
- `tickets`: retain according to contract/legal requirement (default 24 months minimum).

## Archival strategy

1. Monthly export to CSV using `/api/tickets/export?format=csv&from=<iso>&to=<iso>`.
2. Store export in immutable archive location.
3. Record export metadata in release/audit log.
4. After retention period, purge rows in batches with documented approval.

## Required controls

- Archive jobs must be operator-authenticated.
- Deletion operations require dual approval and change ticket reference.


## Maintenance endpoint

- POST /api/internal/maintenance/retention purges aged `auth_attempts` and `export_audit_log` rows according to policy and returns deletion counts.

