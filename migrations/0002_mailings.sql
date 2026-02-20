-- Migration 0002: mailings
-- Session 4 — Mailutskick + RSVP

CREATE TABLE IF NOT EXISTS mailings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  recipient_filter TEXT NOT NULL DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mailings_event_id ON mailings(event_id);
CREATE INDEX IF NOT EXISTS idx_mailings_status ON mailings(status);
