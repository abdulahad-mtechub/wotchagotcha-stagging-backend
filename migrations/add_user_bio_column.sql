-- Migration: Add bio column to users table

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bio TEXT;

COMMIT;

-- Rollback (manual):
-- ALTER TABLE users DROP COLUMN IF EXISTS bio;
