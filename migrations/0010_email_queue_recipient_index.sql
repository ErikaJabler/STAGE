-- Index for looking up email history by event + recipient email
CREATE INDEX IF NOT EXISTS idx_email_queue_recipient ON email_queue(event_id, to_email);
