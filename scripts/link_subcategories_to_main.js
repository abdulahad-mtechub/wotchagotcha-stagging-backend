import fs from 'fs';
import path from 'path';
import pool from '../db.config/index.js';

const dataFile = path.resolve(process.cwd(), 'data', 'categories_to_insert.json');
const frenchFile = path.resolve(process.cwd(), 'data', 'categories_french_by_table.json');
if (!fs.existsSync(dataFile)) { console.error('Missing data file', dataFile); process.exit(1); }
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
const french = fs.existsSync(frenchFile) ? JSON.parse(fs.readFileSync(frenchFile, 'utf8')) : {};

const sectionToParentTable = {
  'Mass Apps': 'app_category',
  'Video-Mania': 'video_category',
  'Pic Tours': 'pic_category',
  'On-News': 'news_category',
  'Open-Letters': 'disc_category',
  'Q & A': 'qafi_category',
  'CVE': 'cve_category',
  'Sports & Sports': 'sports_category',
  'Cinematic': 'cinematics_category',
  'Fan-Star Zone': 'fan_star_category',
  'Kid-Vids': 'kid_vids_category',
  'TV ProgMax': 'tv_progmax_category',
  'Learnings & Hobbies': 'learning_hobbies_category',
  'Mondo Market': 'item_category'
};

const parentToChild = {
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
  const summary = { inserted: [], skipped: [], errors: [] };
  try {
    for (const [section, items] of Object.entries(data)) {
      const parentTable = sectionToParentTable[section];
      if (!parentTable) { summary.errors.push(`no parent table for section ${section}`); continue; }
      const childTable = parentToChild[parentTable];
      if (!childTable) { summary.errors.push(`no child table for parent ${parentTable}`); continue; }

      await client.query('BEGIN');

      // ensure main module row exists
      let pRes = await client.query(`SELECT id FROM ${parentTable} WHERE name = $1 LIMIT 1`, [section]).catch(()=>({rows:[]}));
      let parentId;
      if (pRes.rows && pRes.rows.length) parentId = pRes.rows[0].id;
      else {
        const ins = await client.query(`INSERT INTO ${parentTable} (name, created_at, updated_at) VALUES($1,NOW(),NOW()) RETURNING id`, [section]);
        parentId = ins.rows[0].id;
      }

      // ensure child table exists and has french_name
      await client.query(`CREATE TABLE IF NOT EXISTS ${childTable} (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, french_name VARCHAR(255), category_id INT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`);

      for (const name of items) {
        const exists = await client.query(`SELECT 1 FROM ${childTable} WHERE name=$1 AND category_id=$2 LIMIT 1`, [name, parentId]).catch(()=>({rows:[]}));
        if (exists.rows && exists.rows.length) { summary.skipped.push({ section, name }); continue; }

        // french lookup: prefer childTable mapping, then parentTable mapping
        const frenchMapChild = french[childTable] || {};
        const frenchMapParent = french[parentTable] || {};
        const frenchName = frenchMapChild[name] || frenchMapParent[name] || null;

        const res = await client.query(`INSERT INTO ${childTable} (name, french_name, category_id, created_at, updated_at) VALUES($1,$2,$3,NOW(),NOW()) RETURNING id`, [name, frenchName, parentId]);
        summary.inserted.push({ section, childTable, name, french: frenchName, id: res.rows[0].id });
      }

      await client.query('COMMIT');
    }

    console.log('Link summary:', JSON.stringify(summary, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error linking subcategories:', err.message || err);
    await client.query('ROLLBACK').catch(()=>{});
    process.exit(1);
  } finally {
    client.release();
  }
})();
