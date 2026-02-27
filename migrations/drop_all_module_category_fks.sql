-- Consolidated migration to drop category and subcategory FK constraints across all modules

-- XPI Videos (In case they still exist)
ALTER TABLE xpi_videos DROP CONSTRAINT IF EXISTS xpi_videos_video_category_fkey;
ALTER TABLE xpi_videos DROP CONSTRAINT IF EXISTS xpi_videos_sub_category_fkey;

-- Pic Tours
ALTER TABLE pic_tours DROP CONSTRAINT IF EXISTS pic_tours_pic_category_fkey;
ALTER TABLE pic_tours DROP CONSTRAINT IF EXISTS pic_tours_sub_category_fkey;

-- NEWS
ALTER TABLE NEWS DROP CONSTRAINT IF EXISTS news_category_fkey;
ALTER TABLE NEWS DROP CONSTRAINT IF EXISTS news_sub_category_fkey;

-- QAFI
ALTER TABLE QAFI DROP CONSTRAINT IF EXISTS qafi_category_fkey;
ALTER TABLE QAFI DROP CONSTRAINT IF EXISTS qafi_sub_category_fkey;

-- GEBC
ALTER TABLE gebc DROP CONSTRAINT IF EXISTS gebc_category_fkey;
ALTER TABLE gebc DROP CONSTRAINT IF EXISTS gebc_sub_category_fkey;

-- Sports
ALTER TABLE sports DROP CONSTRAINT IF EXISTS sports_category_id_fkey;
ALTER TABLE sports DROP CONSTRAINT IF EXISTS sports_sub_category_id_fkey;

-- TV Progmax
ALTER TABLE tv_progmax_videos DROP CONSTRAINT IF EXISTS tv_progmax_videos_category_id_fkey;
ALTER TABLE tv_progmax_videos DROP CONSTRAINT IF EXISTS tv_progmax_videos_sub_category_id_fkey;

-- Kid Vids
ALTER TABLE kid_vids_videos DROP CONSTRAINT IF EXISTS kid_vids_videos_category_id_fkey;
ALTER TABLE kid_vids_videos DROP CONSTRAINT IF EXISTS kid_vids_videos_sub_category_id_fkey;

-- Learning Hobbies
ALTER TABLE learning_hobbies_videos DROP CONSTRAINT IF EXISTS learning_hobbies_videos_category_id_fkey;
ALTER TABLE learning_hobbies_videos DROP CONSTRAINT IF EXISTS learning_hobbies_videos_sub_category_id_fkey;

-- Fan Star
ALTER TABLE fan_star_videos DROP CONSTRAINT IF EXISTS fan_star_videos_category_id_fkey;
ALTER TABLE fan_star_videos DROP CONSTRAINT IF EXISTS fan_star_videos_sub_category_id_fkey;

-- Cinematics
ALTER TABLE cinematic_videos DROP CONSTRAINT IF EXISTS cinematic_videos_category_id_fkey;
ALTER TABLE cinematic_videos DROP CONSTRAINT IF EXISTS cinematic_videos_sub_category_id_fkey;

-- Item
ALTER TABLE item DROP CONSTRAINT IF EXISTS item_item_category_fkey;
ALTER TABLE item DROP CONSTRAINT IF EXISTS item_sub_category_fkey;
