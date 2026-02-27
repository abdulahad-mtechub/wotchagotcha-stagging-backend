-- Migration: drop all self-referential shared_post_id foreign keys so shared_post_id can reference other modules
ALTER TABLE IF EXISTS news DROP CONSTRAINT IF EXISTS news_shared_post_id_fkey;
ALTER TABLE IF EXISTS qafi DROP CONSTRAINT IF EXISTS qafi_shared_post_id_fkey;
ALTER TABLE IF EXISTS gebc DROP CONSTRAINT IF EXISTS gebc_shared_post_id_fkey;
ALTER TABLE IF EXISTS pic_tours DROP CONSTRAINT IF EXISTS pic_tours_shared_post_id_fkey;
ALTER TABLE IF EXISTS item DROP CONSTRAINT IF EXISTS item_shared_post_id_fkey;
ALTER TABLE IF EXISTS cinematics_videos DROP CONSTRAINT IF EXISTS cinematics_videos_shared_post_id_fkey;
ALTER TABLE IF EXISTS fan_star_videos DROP CONSTRAINT IF EXISTS fan_star_videos_shared_post_id_fkey;
ALTER TABLE IF EXISTS tv_progmax_videos DROP CONSTRAINT IF EXISTS tv_progmax_videos_shared_post_id_fkey;
ALTER TABLE IF EXISTS kid_vids_videos DROP CONSTRAINT IF EXISTS kid_vids_videos_shared_post_id_fkey;
ALTER TABLE IF EXISTS learning_hobbies_videos DROP CONSTRAINT IF EXISTS learning_hobbies_videos_shared_post_id_fkey;
ALTER TABLE IF EXISTS sports DROP CONSTRAINT IF EXISTS sports_shared_post_id_fkey;
ALTER TABLE IF EXISTS xpi_videos DROP CONSTRAINT IF EXISTS xpi_videos_shared_post_id_fkey;

-- Safe to re-run because of IF EXISTS
