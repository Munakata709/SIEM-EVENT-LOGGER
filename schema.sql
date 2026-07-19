CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_ip TEXT NOT NULL,
  destination_ip TEXT,
  event_type TEXT NOT NULL,
  severity TEXT DEFAULT 'low',
  status TEXT DEFAULT 'open',
  description TEXT DEFAULT ''
);
