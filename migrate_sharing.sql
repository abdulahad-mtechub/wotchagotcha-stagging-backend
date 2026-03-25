
-- Migration to add shared_post_id column to all relevant tables if they don't exist

DO $$
BEGIN
    -- xpi_videos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='xpi_videos' AND column_name='shared_post_id') THEN
        ALTER TABLE xpi_videos ADD COLUMN shared_post_id INT REFERENCES xpi_videos(id) ON DELETE SET NULL;
    END IF;

    -- NEWS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news' AND column_name='shared_post_id') THEN
        ALTER TABLE NEWS ADD COLUMN shared_post_id INT REFERENCES NEWS(id) ON DELETE SET NULL;
    END IF;

    -- QAFI
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='qafi' AND column_name='shared_post_id') THEN
        ALTER TABLE QAFI ADD COLUMN shared_post_id INT REFERENCES QAFI(id) ON DELETE SET NULL;
    END IF;

    -- GEBC
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gebc' AND column_name='shared_post_id') THEN
        ALTER TABLE GEBC ADD COLUMN shared_post_id INT REFERENCES GEBC(id) ON DELETE SET NULL;
    END IF;

    -- pic_tours
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pic_tours' AND column_name='shared_post_id') THEN
        ALTER TABLE pic_tours ADD COLUMN shared_post_id INT REFERENCES pic_tours(id) ON DELETE SET NULL;
    END IF;

    -- cinematics_videos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cinematics_videos' AND column_name='shared_post_id') THEN
        ALTER TABLE cinematics_videos ADD COLUMN shared_post_id INT REFERENCES cinematics_videos(id) ON DELETE SET NULL;
    END IF;

    -- fan_star_videos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fan_star_videos' AND column_name='shared_post_id') THEN
        ALTER TABLE fan_star_videos ADD COLUMN shared_post_id INT REFERENCES fan_star_videos(id) ON DELETE SET NULL;
    END IF;

    -- tv_progmax_videos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tv_progmax_videos' AND column_name='shared_post_id') THEN
        ALTER TABLE tv_progmax_videos ADD COLUMN shared_post_id INT REFERENCES tv_progmax_videos(id) ON DELETE SET NULL;
    END IF;

    -- kid_vids_videos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kid_vids_videos' AND column_name='shared_post_id') THEN
        ALTER TABLE kid_vids_videos ADD COLUMN shared_post_id INT REFERENCES kid_vids_videos(id) ON DELETE SET NULL;
    END IF;

    -- learning_hobbies_videos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_hobbies_videos' AND column_name='shared_post_id') THEN
        ALTER TABLE learning_hobbies_videos ADD COLUMN shared_post_id INT REFERENCES learning_hobbies_videos(id) ON DELETE SET NULL;
    END IF;

    -- sports
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sports' AND column_name='shared_post_id') THEN
        ALTER TABLE sports ADD COLUMN shared_post_id INT REFERENCES sports(id) ON DELETE SET NULL;
    END IF;

    -- item
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='item' AND column_name='shared_post_id') THEN
        ALTER TABLE item ADD COLUMN shared_post_id INT REFERENCES item(id) ON DELETE SET NULL;
    END IF;

END $$;
