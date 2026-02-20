-- Migration 0001: events + participants
-- Session 0 — Stage eventplattform

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  emoji TEXT,
  slug TEXT NOT NULL UNIQUE,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  end_date TEXT,
  end_time TEXT,
  location TEXT NOT NULL,
  description TEXT,
  organizer TEXT NOT NULL,
  organizer_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning',
  type TEXT NOT NULL DEFAULT 'other',
  max_participants INTEGER,
  overbooking_limit INTEGER NOT NULL DEFAULT 0,
  visibility TEXT NOT NULL DEFAULT 'private',
  sender_mailbox TEXT,
  gdpr_consent_text TEXT,
  image_url TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON events(deleted_at);

CREATE TABLE IF NOT EXISTS participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'invited',
  queue_position INTEGER,
  response_deadline TEXT,
  cancellation_token TEXT NOT NULL UNIQUE,
  email_status TEXT,
  gdpr_consent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_participants_event_id ON participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_participants_cancellation_token ON participants(cancellation_token);
