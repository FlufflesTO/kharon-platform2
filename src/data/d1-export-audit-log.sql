CREATE TABLE IF NOT EXISTS export_audit_log (
  id TEXT PRIMARY KEY,
  requested_at TEXT NOT NULL,
  requester_ip TEXT NOT NULL,
  format TEXT NOT NULL,
  filters TEXT,
  tickets_count INTEGER NOT NULL DEFAULT 0,
  events_count INTEGER NOT NULL DEFAULT 0
);
