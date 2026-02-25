-- Migration: add profession column to users table
-- Adds nullable VARCHAR(255) column if it does not already exist

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profession VARCHAR(255);

COMMIT;

-- Rollback (manual):
-- ALTER TABLE users DROP COLUMN IF EXISTS profession;
