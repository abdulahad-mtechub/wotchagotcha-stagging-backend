-- Migration: make category and sub_category columns nullable where currently NOT NULL
DO $$
BEGIN
  -- cinematics_videos
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cinematics_videos' AND column_name='category_id' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE cinematics_videos ALTER COLUMN category_id DROP NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cinematics_videos' AND column_name='sub_category_id' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE cinematics_videos ALTER COLUMN sub_category_id DROP NOT NULL';
  END IF;

  -- fan_star_videos
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fan_star_videos' AND column_name='category_id' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE fan_star_videos ALTER COLUMN category_id DROP NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fan_star_videos' AND column_name='sub_category_id' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE fan_star_videos ALTER COLUMN sub_category_id DROP NOT NULL';
  END IF;

  -- tv_progmax_videos
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tv_progmax_videos' AND column_name='category_id' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE tv_progmax_videos ALTER COLUMN category_id DROP NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tv_progmax_videos' AND column_name='sub_category_id' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE tv_progmax_videos ALTER COLUMN sub_category_id DROP NOT NULL';
  END IF;

  -- kid_vids_videos
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kid_vids_videos' AND column_name='category_id' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE kid_vids_videos ALTER COLUMN category_id DROP NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kid_vids_videos' AND column_name='sub_category_id' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE kid_vids_videos ALTER COLUMN sub_category_id DROP NOT NULL';
  END IF;

  -- learning_hobbies_videos
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_hobbies_videos' AND column_name='category_id' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE learning_hobbies_videos ALTER COLUMN category_id DROP NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_hobbies_videos' AND column_name='sub_category_id' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE learning_hobbies_videos ALTER COLUMN sub_category_id DROP NOT NULL';
  END IF;

  -- xpi_videos (video_category & sub_category)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='xpi_videos' AND column_name='video_category' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE xpi_videos ALTER COLUMN video_category DROP NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='xpi_videos' AND column_name='sub_category' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE xpi_videos ALTER COLUMN sub_category DROP NOT NULL';
  END IF;

  -- sports (category_id & sub_category_id)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sports' AND column_name='category_id' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE sports ALTER COLUMN category_id DROP NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sports' AND column_name='sub_category_id' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE sports ALTER COLUMN sub_category_id DROP NOT NULL';
  END IF;

  -- pic_tours (pic_category & sub_category)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pic_tours' AND column_name='pic_category' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE pic_tours ALTER COLUMN pic_category DROP NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pic_tours' AND column_name='sub_category' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE pic_tours ALTER COLUMN sub_category DROP NOT NULL';
  END IF;

  -- item (item_category & sub_category)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='item' AND column_name='item_category' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE item ALTER COLUMN item_category DROP NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='item' AND column_name='sub_category' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE item ALTER COLUMN sub_category DROP NOT NULL';
  END IF;

  -- GEBC (category & sub_category)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gebc' AND column_name='category' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE gebc ALTER COLUMN category DROP NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gebc' AND column_name='sub_category' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE gebc ALTER COLUMN sub_category DROP NOT NULL';
  END IF;

  -- NEWS (category & sub_category)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news' AND column_name='category' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE news ALTER COLUMN category DROP NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news' AND column_name='sub_category' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE news ALTER COLUMN sub_category DROP NOT NULL';
  END IF;

  -- QAFI
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='qafi' AND column_name='category' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE qafi ALTER COLUMN category DROP NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='qafi' AND column_name='sub_category' AND is_nullable='NO') THEN
    EXECUTE 'ALTER TABLE qafi ALTER COLUMN sub_category DROP NOT NULL';
  END IF;

END$$;

-- Note: This migration only drops NOT NULL constraints where present. It is safe to re-run because it checks
-- for column existence and current nullability before executing each ALTER.
