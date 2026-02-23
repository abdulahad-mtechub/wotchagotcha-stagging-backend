-- Seed GEBC: ensure subcategories Emotions, Thoughts, Actions, Objects
-- and insert 10 sample GEBC rows per subcategory for each GEBC category.
-- Run in psql connected to your database (make a backup first).

BEGIN;

DO $$
DECLARE
  cat RECORD;
  subname TEXT;
  subid INT;
  seed_user_id INT;
  i INT;
BEGIN
  -- Ensure at least one non-deleted user exists; create a seed user if none
  SELECT id INTO seed_user_id FROM users WHERE is_deleted=FALSE LIMIT 1;
  IF seed_user_id IS NULL THEN
    INSERT INTO users (email, password, role, username, device_id, created_at, updated_at)
    VALUES ('seed_gebc_user@example.com', 'seed_password', 'user', 'seed_gebc_user', NULL, NOW(), NOW())
    RETURNING id INTO seed_user_id;
  END IF;

  FOR cat IN SELECT id FROM gebc_category LOOP
    FOREACH subname IN ARRAY ARRAY['Emotions','Thoughts','Actions','Objects'] LOOP
      -- create subcategory if it doesn't exist
      SELECT id INTO subid FROM gebc_sub_category WHERE name = subname AND category_id = cat.id LIMIT 1;
      IF subid IS NULL THEN
        INSERT INTO gebc_sub_category(name, french_name, category_id, created_at, updated_at)
        VALUES (subname, NULL, cat.id, NOW(), NOW())
        RETURNING id INTO subid;
      END IF;

      -- Insert 10 sample GEBC records for this subcategory
      FOR i IN 1..10 LOOP
        INSERT INTO gebc(description, category, sub_category, image, user_id, created_at, updated_at)
        VALUES (
          concat('Sample ', subname, ' record ', i, ' for category id ', cat.id),
          cat.id,
          subid,
          '',
          seed_user_id,
          NOW(),
          NOW()
        );
      END LOOP;
    END LOOP;
  END LOOP;
END$$;

COMMIT;

-- Notes:
-- 1) This script assumes tables are named: gebc_category, gebc_sub_category, gebc, users.
-- 2) If your schema uses different names/casing (e.g., GEBC_category), adjust identifiers or run with double quotes.
-- 3) Back up your DB before running.
