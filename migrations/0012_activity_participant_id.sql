-- Add participant_id to activities for per-participant activity log
ALTER TABLE activities ADD COLUMN participant_id INTEGER REFERENCES participants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_activities_participant ON activities(participant_id, created_at DESC);
