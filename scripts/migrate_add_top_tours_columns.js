import pool from '../db.config/index.js';

async function run() {
  try {
    console.log('Starting migration: add top_tours_id to pic_comment and ensure top_tours_like');
    await pool.query('BEGIN');

    await pool.query("ALTER TABLE public.pic_comment ALTER COLUMN pic_tours_id DROP NOT NULL;");
    console.log('Dropped NOT NULL on pic_comment.pic_tours_id');

    await pool.query("ALTER TABLE public.pic_comment ADD COLUMN IF NOT EXISTS top_tours_id INT;");
    console.log('Ensured column pic_comment.top_tours_id exists');

    await pool.query(`DO $$\nBEGIN\n  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pic_comment_top_tours_id_fkey') THEN\n    ALTER TABLE public.pic_comment ADD CONSTRAINT pic_comment_top_tours_id_fkey FOREIGN KEY (top_tours_id) REFERENCES public.top_tours(id) ON DELETE CASCADE;\n  END IF;\nEND\n$$;`);
    console.log('Ensured FK constraint pic_comment_top_tours_id_fkey exists');

    await pool.query(`CREATE TABLE IF NOT EXISTS public.top_tours_like (\n  id SERIAL PRIMARY KEY,\n  pic_tours_id INT REFERENCES public.top_tours(id) ON DELETE CASCADE NOT NULL,\n  user_id INT REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n);`);
    console.log('Ensured table top_tours_like exists');

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
