import pool from '../db.config/index.js';
import fs from 'fs';
import process from 'process';

const mapping = {
  app_category: 'app_sub_category',
  item_category: 'item_sub_category',
  disc_category: 'disc_sub_category',
  video_category: 'video_sub_category',
  pic_category: 'pic_sub_category',
  QAFI_category: 'QAFI_sub_category',
  GEBC_category: 'GEBC_sub_category',
  NEWS_category: 'NEWS_sub_category',
  cinematics_category: 'cinematics_sub_category',
  fan_star_category: 'fan_star_sub_category',
  tv_progmax_category: 'tv_progmax_sub_category',
  kid_vids_category: 'kid_vids_sub_category',
  learning_hobbies_category: 'learning_hobbies_sub_category',
  sports_category: 'sport_sub_category'
};

const subsFile = 'data/default_subs.json';
const defaultSubs = JSON.parse(fs.readFileSync(subsFile));

async function dryRun() {
  console.log('Dry-run: previewing subcategory inserts (no changes)');
  for (const [parentTable, childTable] of Object.entries(mapping)) {
    try {
      const parents = await pool.query(`SELECT id, name FROM ${parentTable}`);
      if (parents.rows.length === 0) continue;
      console.log(`\n${parentTable} -> ${childTable}: ${parents.rows.length} parent(s)`);
      for (const p of parents.rows) {
        for (const s of defaultSubs.subs) {
          const exists = await pool.query(`SELECT 1 FROM ${childTable} WHERE name = $1 AND category_id = $2 LIMIT 1`, [s.name, p.id]).catch(()=>null);
          if (exists && exists.rows && exists.rows.length) {
            console.log(`  SKIP: ${childTable} already has '${s.name}' for parent '${p.name}'`);
          } else {
            console.log(`  WOULD INSERT: ${childTable} name='${s.name}' french_name='${s.french_name}' category_id=${p.id} (parent='${p.name}')`);
          }
        }
      }
    } catch (err) {
      if (/does not exist/.test(err.message)) {
        console.warn(`${childTable}: table not found, skipping`);
        continue;
      }
      console.error(`${parentTable}: ERROR — ${err.message}`);
    }
  }
}

async function apply() {
  const client = await pool.connect();
  try {
    for (const [parentTable, childTable] of Object.entries(mapping)) {
      try {
        const parents = await client.query(`SELECT id, name FROM ${parentTable}`);
        if (parents.rows.length === 0) continue;
        await client.query('BEGIN');
        // ensure child table has french_name column
        await client.query(`ALTER TABLE ${childTable} ADD COLUMN IF NOT EXISTS french_name VARCHAR(255)`);
        for (const p of parents.rows) {
          for (const s of defaultSubs.subs) {
            const exists = await client.query(`SELECT 1 FROM ${childTable} WHERE name = $1 AND category_id = $2 LIMIT 1`, [s.name, p.id]).catch(()=>null);
            if (exists && exists.rows && exists.rows.length) {
              console.log(`SKIP: ${childTable} already has '${s.name}' for parent '${p.name}'`);
              continue;
            }
            const res = await client.query(`INSERT INTO ${childTable} (name, french_name, category_id, created_at, updated_at) VALUES ($1,$2,$3,NOW(),NOW()) RETURNING id`, [s.name, s.french_name, p.id]);
            console.log(`INSERTED: ${childTable} id=${res.rows[0].id} name='${s.name}' for parent id=${p.id}`);
          }
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        if (/does not exist/.test(err.message)) {
          console.warn(`${childTable}: table missing, skipped`);
          continue;
        }
        console.error(`${childTable}: transaction error — ${err.message}`);
      }
    }
  } finally {
    client.release();
  }
}

async function main() {
  const dry = process.argv.includes('--dry-run') || process.argv.includes('-d');
  if (dry) {
    await dryRun();
    process.exit(0);
  }
  console.log('Applying inserts: adding two default subcategories per main category');
  await apply();
  process.exit(0);
}

main().catch(e=>{ console.error('Fatal:', e.message); process.exit(1); });
