-- Migration: add "index" column to category and subcategory tables
-- Adds an integer column named "index" (default 0, NOT NULL) for frontend sorting

ALTER TABLE IF EXISTS public.app_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.app_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.item_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.item_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.disc_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.disc_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.disc_sub_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.disc_sub_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.video_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.video_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.video_sub_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.video_sub_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.pic_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.pic_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.pic_sub_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.pic_sub_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.QAFI_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.QAFI_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.QAFI_sub_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.QAFI_sub_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.GEBC_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.GEBC_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.GEBC_sub_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.GEBC_sub_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.NEWS_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.NEWS_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.NEWS_sub_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.NEWS_sub_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.cinematics_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.cinematics_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.cinematics_sub_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.cinematics_sub_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.fan_star_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.fan_star_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.fan_star_sub_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.fan_star_sub_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.tv_progmax_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.tv_progmax_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.tv_progmax_sub_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.tv_progmax_sub_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.kid_vids_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.kid_vids_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.kid_vids_sub_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.kid_vids_sub_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.learning_hobbies_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.learning_hobbies_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.learning_hobbies_sub_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.learning_hobbies_sub_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.sports_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.sports_category ALTER COLUMN "index" SET NOT NULL;

ALTER TABLE IF EXISTS public.sport_sub_category ADD COLUMN IF NOT EXISTS "index" INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.sport_sub_category ALTER COLUMN "index" SET NOT NULL;

-- Add other category/subcategory tables as needed

COMMIT;
