-- Migration 0005: Add dietary_notes + plus_one fields to participants
-- Session 12: RSVP-förbättringar

ALTER TABLE participants ADD COLUMN dietary_notes TEXT;
ALTER TABLE participants ADD COLUMN plus_one_name TEXT;
ALTER TABLE participants ADD COLUMN plus_one_email TEXT;
