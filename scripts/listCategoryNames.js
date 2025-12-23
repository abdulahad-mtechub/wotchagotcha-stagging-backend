import pool from '../db.config/index.js';

const tables = [
  'app_category','item_category','disc_category','disc_sub_category',
  'video_category','video_sub_category','pic_category','pic_sub_category',
  'QAFI_category','QAFI_sub_category','GEBC_category','GEBC_sub_category',
  'NEWS_category','NEWS_sub_category','cinematics_category','cinematics_sub_category',
  'fan_star_category','fan_star_sub_category','tv_progmax_category','tv_progmax_sub_category',
  'kid_vids_category','kid_vids_sub_category','learning_hobbies_category','learning_hobbies_sub_category',
  'sports_category','sport_sub_category'
];

async function main() {
  console.log('Listing distinct `name` values from category and subcategory tables:');
  for (const t of tables) {
    try {
      const res = await pool.query(`SELECT DISTINCT name FROM ${t} ORDER BY name`);
      if (res.rows.length > 0) {
        console.log('\n' + t + ':');
        for (const r of res.rows) console.log('  -', r.name);
      }
    } catch (err) {
      // skip missing tables
      if (!/does not exist/.test(err.message)) console.error(`${t}: ERROR — ${err.message}`);
    }
  }
  process.exit(0);
}

main().catch(e=>{ console.error(e); process.exit(1); });
