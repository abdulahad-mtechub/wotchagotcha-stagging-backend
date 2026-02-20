import pool from '../db.config/index.js';

const tables = [
  'video_sub_category',
  'pic_sub_category',
  'QAFI_sub_category',
  'GEBC_sub_category',
  'NEWS_sub_category',
  'cinematics_sub_category',
  'fan_star_sub_category',
  'tv_progmax_sub_category',
  'kid_vids_sub_category',
  'learning_hobbies_sub_category',
  'sport_sub_category',
  'item_sub_category'
];

async function migrate() {
  try {
    console.log('Connected to DB, starting add "index" column to subcategory tables migration...');
    for (const t of tables) {
      const colCheck = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name=$1 AND column_name='index'`, [t]);
      if (colCheck.rowCount === 0) {
        console.log(`Adding column index to ${t}`);
        await pool.query(`ALTER TABLE ${t} ADD COLUMN "index" INT DEFAULT 0;`);
      } else {
        console.log(`Table ${t} already has index column`);
      }
    }
    console.log('Migration completed.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
