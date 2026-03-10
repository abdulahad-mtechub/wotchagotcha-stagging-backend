-- Migration: Add privacy settings and profile likes table

BEGIN;

-- Add privacy settings direct fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS hide_email BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hide_location BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hide_profession BOOLEAN DEFAULT FALSE;

-- Create user_profile_likes table
CREATE TABLE IF NOT EXISTS public.user_profile_likes (
    id SERIAL PRIMARY KEY,
    liked_user_id INT REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    liked_by_user_id INT REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_profile_like UNIQUE (liked_user_id, liked_by_user_id)
);

COMMIT;

-- Rollback (manual):
-- ALTER TABLE users DROP COLUMN IF EXISTS hide_email;
-- ALTER TABLE users DROP COLUMN IF EXISTS hide_location;
-- ALTER TABLE users DROP COLUMN IF EXISTS hide_profession;
-- DROP TABLE IF EXISTS public.user_profile_likes;
