-- Migration 0011: Add plus_one_dietary_notes column for separate guest dietary tracking
ALTER TABLE participants ADD COLUMN plus_one_dietary_notes TEXT;
