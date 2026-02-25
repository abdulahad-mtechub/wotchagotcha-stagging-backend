-- Migration: add state and region columns to users table
-- Adds nullable VARCHAR(255) columns if they do not already exist

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS state VARCHAR(255),
  ADD COLUMN IF NOT EXISTS region VARCHAR(255);

COMMIT;

-- Rollback (manual):
-- ALTER TABLE users DROP COLUMN IF EXISTS state;
-- ALTER TABLE users DROP COLUMN IF EXISTS region;
