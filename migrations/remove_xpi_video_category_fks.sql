
-- Migration: Drop foreign key constraints for categories in xpi_videos to allow cross-module sharing
-- These constraints are too restrictive as IDs may come from NEWS_category or other module-specific tables.

DO $$
BEGIN
    -- Drop video_category FK if exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'xpi_videos_video_category_fkey') THEN
        ALTER TABLE xpi_videos DROP CONSTRAINT xpi_videos_video_category_fkey;
    END IF;

    -- Drop sub_category FK if exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'xpi_videos_sub_category_fkey') THEN
        ALTER TABLE xpi_videos DROP CONSTRAINT xpi_videos_sub_category_fkey;
    END IF;
END $$;
