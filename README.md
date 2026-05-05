# Kharon Platform 2

This project provides an internal **Service Level Agreement (SLA) ticketing system** built with [Astro](https://astro.build/) and Cloudflare D1. It includes a public-facing triage endpoint for clients to submit requests and an internal dashboard for technicians to manage and track tickets.

## Features

- **Ticket submission** - The `/api/triage` endpoint accepts JSON payloads with `type`, `priority`, `name`, `email` and `message`. It stores a new ticket in the D1 database, calculates an SLA due date and sends notification emails.
- **Internal dashboard** - Accessible under `/internal`, this dashboard lists all tickets with their status, priority and SLA information. Staff can assign tickets, move them through the workflow (`open -> assigned -> in_progress -> resolved` or `cancelled`) and view a proof of status changes. A status filter allows technicians to quickly focus on specific sets of tickets.
- **Role-aware authorization** - Internal endpoints enforce role scopes (`administrator`, `manager`, `technician`, `finance`, `client`) with `401` for unauthenticated access and `403` for insufficient permissions.
- **SLA breach detection** - The `/api/tickets/refresh-sla` endpoint updates tickets whose `sla_due_at` is in the past by setting `sla_breached = 1` and is accessible via a "Refresh SLA Breaches" button in the dashboard.
- **Audit trail** - Every status change is recorded in the `ticket_events` table with the previous value, new value and an optional note. This provides proof for auditing and is displayed under "View proof."
- **Email notifications** - Optional integration with the Resend API allows the system to send internal notifications and client confirmations.

## Getting started

### Prerequisites

- Node.js (v18+ recommended)
- A package manager like npm
- Access to a Cloudflare account with D1 enabled
- (Optional) A Resend API key and configured sender address

### Installation

```sh
npm install
cp .env.example .env  # edit values for your environment
npm run dev
```

### Environment variables

- `DB` - Bound D1 database instance.
- `INTERNAL_ACCESS_TOKEN_ADMINISTRATOR` - Required administrator token.
- `INTERNAL_ACCESS_TOKEN_MANAGER` - Optional manager token.
- `INTERNAL_ACCESS_TOKEN_TECHNICIAN` - Optional technician token.
- `INTERNAL_ACCESS_TOKEN_FINANCE` - Optional finance token.
- `INTERNAL_ACCESS_TOKEN_CLIENT` - Optional client token (read-only scope).
- `INTERNAL_ACCESS_TOKEN` - Legacy fallback token (treated as administrator when role tokens are not configured).
- `ARCHIVE_BUCKET` - Required R2 bucket binding for immutable monthly archive CSV export.
- `RESEND_API_KEY` - (Optional) Resend API key.
- `EMAIL_FROM` - (Optional) From-address for Resend emails.

### Database schema

The D1 database contains `tickets` (ticket details) and `ticket_events` (status change logs) tables. Schema files live under `src/data/`.

### Development workflow

1. POST to `/api/triage` creates tickets.
2. Log in to the internal dashboard by sending a valid role token to `/api/auth/login`.
3. Filter tickets by status and use "Refresh SLA Breaches" to mark overdue tickets.
4. Use Assign/Start/Resolve/Cancel buttons to manage the workflow.
5. View the audit trail via "View proof."

### Branch sync

Keep feature branches up-to-date with `main`:

```sh
git checkout main
git pull origin main
git checkout my-feature
git rebase main
```

## Contributing

Please update this README and any relevant docs when adding new endpoints, UI features or migrations. Use semantic commits and include tests where appropriate.


