-- Migration: add "index" column to cinematics_sub_category and populate values per category
ALTER TABLE IF EXISTS public.cinematics_sub_category
ADD COLUMN IF NOT EXISTS "index" INT DEFAULT 0;

-- Populate index values per category based on created_at (0-based)
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at DESC) - 1 AS idx
  FROM cinematics_sub_category
)
UPDATE cinematics_sub_category s
SET "index" = o.idx
FROM ordered o
WHERE s.id = o.id;
