-- Migration: Add Like, Comment, Share, Report support to Open Letter module

-- 1. Add shared_post_id to post_letters table (for Share)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='post_letters' AND column_name='shared_post_id') THEN
        ALTER TABLE public.post_letters ADD COLUMN shared_post_id INT REFERENCES public.post_letters(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Create like_post_letter table
CREATE TABLE IF NOT EXISTS public.like_post_letter (
    id SERIAL PRIMARY KEY,
    letter_id INT REFERENCES post_letters(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create comment_post_letter table
CREATE TABLE IF NOT EXISTS public.comment_post_letter (
    id SERIAL PRIMARY KEY,
    letter_id INT REFERENCES post_letters(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create report_post_letter table
CREATE TABLE IF NOT EXISTS public.report_post_letter (
    id SERIAL PRIMARY KEY,
    letter_id INT REFERENCES post_letters(id) ON DELETE CASCADE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
