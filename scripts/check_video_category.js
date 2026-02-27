import pool from "../db.config/index.js";

const args = process.argv.slice(2);
const catId = args[0];
const subId = args[1];
console.log('check_video_category args:', args);

async function run() {
  try {
    if (catId) {
      const r = await pool.query("SELECT id,name FROM video_category WHERE id=$1", [catId]);
      console.log('video_category result for', catId, ':', r.rows);
    }
    if (subId) {
      const r2 = await pool.query("SELECT id,name,category_id FROM video_sub_category WHERE id=$1", [subId]);
      console.log('video_sub_category result for', subId, ':', r2.rows);
    }
  } catch (err) {
    console.error('query error', err.stack || err);
  } finally {
    await pool.end();
  }
}

run();
