import pool from '../db.config/index.js';

const tables = [
  'app_sub_category',
  'video_sub_category',
  'pic_sub_category',
  'NEWS_sub_category',
  'disc_sub_category',
  'QAFI_sub_category',
  'cve_sub_category',
  'sport_sub_category',
  'cinematics_sub_category',
  'fan_star_sub_category',
  'kid_vids_sub_category',
  'tv_progmax_sub_category',
  'learning_hobbies_sub_category',
  'item_sub_category'
];

(async () => {
  console.log('Starting update of "All others" timestamps...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const table of tables) {
      const q = `UPDATE ${table} SET created_at = $1, updated_at = $1 WHERE name ILIKE 'All others'`;
      const now = '2000-01-01 00:00:00';
      try {
        const res = await client.query(q, [now]);
        console.log(`${table}: ${res.rowCount} row(s) updated`);
      } catch (err) {
        console.warn(`${table}: update failed or table missing - ${err.message}`);
      }
    }
    await client.query('COMMIT');
    console.log('All updates committed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction failed, rolled back:', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
})();
