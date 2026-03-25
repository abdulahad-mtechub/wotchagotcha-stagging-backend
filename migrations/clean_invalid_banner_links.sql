-- Migration: set invalid or empty banner_link values to NULL so new constraint can be applied
BEGIN;

-- Set empty or whitespace-only links to NULL
UPDATE public.banner
SET banner_link = NULL
WHERE banner_link IS NOT NULL AND trim(banner_link) = '';

-- Set links that do not match the URL regex to NULL
UPDATE public.banner
SET banner_link = NULL
WHERE banner_link IS NOT NULL AND banner_link::text !~* 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,255}\\.[a-z]{2,9}\\y([-a-zA-Z0-9@:%_\\+.~#?&//=]*)$'::text;

COMMIT;
