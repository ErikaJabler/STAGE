-- Migration 0007: Website columns on events
-- Session 15 — Eventwebbplats

ALTER TABLE events ADD COLUMN website_template TEXT;
ALTER TABLE events ADD COLUMN website_data TEXT;
ALTER TABLE events ADD COLUMN website_published INTEGER NOT NULL DEFAULT 0;
