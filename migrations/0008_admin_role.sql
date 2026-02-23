-- Migration 0008: Add global admin role to users
-- Session 17: Systemadmin + brand-kontroll

ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;
