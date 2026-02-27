-- Migration: drop foreign key constraint that enforces shared_post_id referencing xpi_videos
ALTER TABLE IF EXISTS xpi_videos
  DROP CONSTRAINT IF EXISTS xpi_videos_shared_post_id_fkey;

-- Safe to re-run: uses IF EXISTS
