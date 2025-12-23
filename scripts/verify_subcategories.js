import pool from '../db.config/index.js';

const mapping = {
  app_category: 'app_sub_category',
  video_category: 'video_sub_category',
  pic_category: 'pic_sub_category',
  news_category: 'NEWS_sub_category',
  disc_category: 'disc_sub_category',
  qafi_category: 'QAFI_sub_category',
  cve_category: 'cve_sub_category',
  sports_category: 'sport_sub_category',
  cinematics_category: 'cinematics_sub_category',
  fan_star_category: 'fan_star_sub_category',
  kid_vids_category: 'kid_vids_sub_category',
  tv_progmax_category: 'tv_progmax_sub_category',
  learning_hobbies_category: 'learning_hobbies_sub_category',
  item_category: 'item_sub_category'
};

(async ()=>{
  const client = await pool.connect();
  try {
    for (const [parent, child] of Object.entries(mapping)) {
      try {
        const pCount = await client.query(`SELECT COUNT(*)::int AS cnt FROM ${parent}`);
        console.log(`\n${parent}: ${pCount.rows[0].cnt} rows`);
        const pRows = await client.query(`SELECT id, name, french_name FROM ${parent} ORDER BY id ASC LIMIT 5`);
        console.log('  sample parents:', pRows.rows);

        const cCountQ = `SELECT COUNT(*)::int AS cnt FROM ${child}`;
        const cCount = await client.query(cCountQ).catch(()=>({rows:[{cnt:0}]}));
        console.log(`  ${child}: ${cCount.rows[0].cnt} rows`);

        const cSampleQ = `SELECT id, name, french_name, category_id FROM ${child} ORDER BY id ASC LIMIT 5`;
        const cRows = await client.query(cSampleQ).catch(()=>({rows:[]}));
        console.log('  sample subs:', cRows.rows);
      } catch (err) {
        console.warn(`  Skipping ${parent}/${child}: ${err.message}`);
      }
    }
  } finally {
    client.release();
    process.exit(0);
  }
})();
