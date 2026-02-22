-- Migration 0006: Add html_body and editor_data columns to mailings
-- html_body: Complete HTML from GrapeJS editor (used directly when sending)
-- editor_data: GrapeJS project JSON (for re-opening in editor)

ALTER TABLE mailings ADD COLUMN html_body TEXT;
ALTER TABLE mailings ADD COLUMN editor_data TEXT;
