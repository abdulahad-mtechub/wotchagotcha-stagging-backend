-- Migration: add city, country, province columns to users table
-- Adds nullable VARCHAR(255) columns if they do not already exist

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS city VARCHAR(255),
  ADD COLUMN IF NOT EXISTS country VARCHAR(255),
  ADD COLUMN IF NOT EXISTS province VARCHAR(255);

COMMIT;

-- To rollback (manual):
-- ALTER TABLE users DROP COLUMN IF EXISTS city;
-- ALTER TABLE users DROP COLUMN IF EXISTS country;
-- ALTER TABLE users DROP COLUMN IF EXISTS province;
