-- Migration 0004: Activities + Email Queue (Session 11)

-- Activity log per event
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata TEXT,  -- JSON
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activities_event ON activities(event_id, created_at DESC);

-- Email queue for Cron Trigger processing
CREATE TABLE IF NOT EXISTS email_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mailing_id INTEGER NOT NULL REFERENCES mailings(id),
  event_id INTEGER NOT NULL REFERENCES events(id),
  to_email TEXT NOT NULL,
  to_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  plain_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, sent, failed
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_email_queue_mailing ON email_queue(mailing_id);
