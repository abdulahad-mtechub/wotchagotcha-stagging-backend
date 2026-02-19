-- Drop the banner link check constraint which validates banner_link format
ALTER TABLE public.banner DROP CONSTRAINT IF EXISTS check_valid_banner_link;

-- If the constraint was implemented as a CHECK on banner_link content, the above will remove it.
-- No further actions are performed in this migration.
