CREATE TABLE tickets (
  id TEXT PRIMARY KEY,
  type TEXT,
  status TEXT,
  priority TEXT,
  created_at TEXT,
  updated_at TEXT,
  name TEXT,
  email TEXT,
  message TEXT,
  assigned_to TEXT
);
