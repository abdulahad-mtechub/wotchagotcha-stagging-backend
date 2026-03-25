import pool from '../db.config/index.js';

(async ()=>{
  const client = await pool.connect();
  try {
    const categoryId = 1; // Video-Mania main id
    const cCount = await client.query(`SELECT COUNT(*)::int AS cnt FROM video_sub_category WHERE category_id = $1`, [categoryId]);
    console.log(`video_sub_category rows for category_id=${categoryId}:`, cCount.rows[0].cnt);

    const rows = await client.query(`SELECT id, name, french_name, category_id, created_at FROM video_sub_category WHERE category_id = $1 ORDER BY id ASC`, [categoryId]);
    console.log('rows:');
    for (const r of rows.rows) console.log(r);
  } catch (err) {
    console.error('query error', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
})();
