-- Migration: make banner_link nullable and update its CHECK constraint
BEGIN;

-- Allow NULLs for banner_link first so we can normalize values
ALTER TABLE public.banner
  ALTER COLUMN banner_link DROP NOT NULL;

-- Normalize existing banner_link values: set empty or invalid strings to NULL
UPDATE public.banner
SET banner_link = NULL
WHERE banner_link IS NOT NULL AND trim(banner_link) = '';

UPDATE public.banner
SET banner_link = NULL
WHERE banner_link IS NOT NULL AND banner_link::text !~* 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,255}\\.[a-z]{2,9}\\y([-a-zA-Z0-9@:%_\\+.~#?&//=]*)$'::text;

-- Replace the old constraint with a new one that permits NULLs
ALTER TABLE public.banner
  DROP CONSTRAINT IF EXISTS check_valid_banner_link;

ALTER TABLE public.banner
  ADD CONSTRAINT check_valid_banner_link CHECK (
    banner_link IS NULL OR banner_link::text ~* 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,255}\\.[a-z]{2,9}\\y([-a-zA-Z0-9@:%_\\+.~#?&//=]*)$'::text
  );

COMMIT;
