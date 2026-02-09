import pool from '../db.config/index.js';

async function run() {
  try {
    console.log('Starting migration: add top_video_id to video_comment');

    await pool.query('BEGIN');

    // Make video_id nullable
    await pool.query("ALTER TABLE public.video_comment ALTER COLUMN video_id DROP NOT NULL;");
    console.log('Dropped NOT NULL on video_comment.video_id');

    // Add top_video_id column if missing
    await pool.query("ALTER TABLE public.video_comment ADD COLUMN IF NOT EXISTS top_video_id INT;");
    console.log('Ensured column video_comment.top_video_id exists');

    // Add FK constraint if not exists
    await pool.query(`DO $$\nBEGIN\n  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_comment_top_video_id_fkey') THEN\n    ALTER TABLE public.video_comment ADD CONSTRAINT video_comment_top_video_id_fkey FOREIGN KEY (top_video_id) REFERENCES public.top_video(id) ON DELETE CASCADE;\n  END IF;\nEND\n$$;`);
    console.log('Ensured FK constraint video_comment_top_video_id_fkey exists');

    // Ensure top_video_like table exists
    await pool.query(`CREATE TABLE IF NOT EXISTS public.top_video_like (\n  id SERIAL PRIMARY KEY,\n  video_id INT REFERENCES public.top_video(id) ON DELETE CASCADE NOT NULL,\n  user_id INT REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n);`);
    console.log('Ensured table top_video_like exists');

    await pool.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    try { await pool.query('ROLLBACK'); } catch (e) { console.error('Rollback failed', e); }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
