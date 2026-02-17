-- Migration: add banner category columns
-- Add polymorphic category columns and set sensible defaults for existing rows
BEGIN;

ALTER TABLE public.banner
  ADD COLUMN IF NOT EXISTS category_table VARCHAR(100) NOT NULL DEFAULT 'none';

ALTER TABLE public.banner
  ADD COLUMN IF NOT EXISTS category_id INT NOT NULL DEFAULT 0;

COMMIT;

-- After running this migration you may want to remove the DEFAULTs if you don't want them for future inserts:
-- ALTER TABLE public.banner ALTER COLUMN category_table DROP DEFAULT;
-- ALTER TABLE public.banner ALTER COLUMN category_id DROP DEFAULT;
