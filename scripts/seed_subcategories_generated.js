import fs from 'fs';
import path from 'path';
import pool from '../db.config/index.js';

const categoriesFile = path.resolve(process.cwd(), 'data', 'categories_to_insert.json');
const frenchFile = path.resolve(process.cwd(), 'data', 'categories_french_by_table.json');
const outFile = path.resolve(process.cwd(), 'data', 'subcategories_to_insert.json');

if (!fs.existsSync(categoriesFile)) {
  console.error('Missing categories file:', categoriesFile);
  process.exit(1);
}

const categories = JSON.parse(fs.readFileSync(categoriesFile, 'utf8'));
const frenchData = fs.existsSync(frenchFile) ? JSON.parse(fs.readFileSync(frenchFile, 'utf8')) : {};

// map section -> parent table and parent table -> child sub table
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

function makeSubNames(parent) {
  return [
    `${parent} - Overview`,
    `${parent} - Guides`,
    `${parent} - Trends`
  ];
}

function makeFrench(parentFrench) {
  return [
    `${parentFrench} - Aperçu`,
    `${parentFrench} - Guides`,
    `${parentFrench} - Tendances`
  ];
}

(async ()=>{
  // build JSON structure and write it
  const generated = {};
  for (const [section, items] of Object.entries(categories)) {
    generated[section] = {};
    for (const parent of items) {
      const subs = makeSubNames(parent);
      // attempt to find french parent via parent table mapping
      const parentTable = sectionToParentTable[section];
      let parentFrench = null;
      if (parentTable && frenchData[parentTable] && frenchData[parentTable][parent]) parentFrench = frenchData[parentTable][parent];
      if (!parentFrench) parentFrench = parent;
      const frenchSubs = makeFrench(parentFrench);
      generated[section][parent] = subs.map((s, i) => ({ name: s, french_name: frenchSubs[i] }));
    }
  }

  fs.writeFileSync(outFile, JSON.stringify(generated, null, 2));
  console.log('Wrote generated subcategories to', outFile);

  // now insert into DB
  const client = await pool.connect();
  const summary = { inserted: [], skipped: [], errors: [] };
  try {
    for (const [section, parents] of Object.entries(generated)) {
      const parentTable = sectionToParentTable[section];
      if (!parentTable) { summary.errors.push(`no parent table for section ${section}`); continue; }
      const childTable = parentToChild[parentTable];
      if (!childTable) { summary.errors.push(`no child table for parent ${parentTable}`); continue; }

      // ensure child table exists and has french_name and category_id
      await client.query(`CREATE TABLE IF NOT EXISTS ${childTable} (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, french_name VARCHAR(255), category_id INT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`);

      for (const [parentName, subs] of Object.entries(parents)) {
        // find parent id in parentTable by exact name; if missing create it
        let pRes = await client.query(`SELECT id FROM ${parentTable} WHERE name = $1 LIMIT 1`, [parentName]).catch(()=>({rows:[]}));
        let parentId;
        if (pRes.rows && pRes.rows.length) parentId = pRes.rows[0].id;
        else {
          const ins = await client.query(`INSERT INTO ${parentTable} (name, created_at, updated_at) VALUES($1,NOW(),NOW()) RETURNING id`, [parentName]);
          parentId = ins.rows[0].id;
        }

        for (const s of subs) {
          // avoid duplicates for same parent
          const exists = await client.query(`SELECT 1 FROM ${childTable} WHERE name=$1 AND category_id=$2 LIMIT 1`, [s.name, parentId]).catch(()=>({rows:[]}));
          if (exists.rows && exists.rows.length) { summary.skipped.push({ childTable, parentName, name: s.name }); continue; }
          const res = await client.query(`INSERT INTO ${childTable} (name, french_name, category_id, created_at, updated_at) VALUES($1,$2,$3,NOW(),NOW()) RETURNING id`, [s.name, s.french_name, parentId]);
          summary.inserted.push({ childTable, parentName, name: s.name, french: s.french_name, id: res.rows[0].id });
        }
      }
    }
    console.log('Insert summary:', JSON.stringify(summary, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error seeding subcategories:', err.message || err);
    process.exit(1);
  } finally {
    client.release();
  }
})();
