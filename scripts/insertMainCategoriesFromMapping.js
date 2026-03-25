import fs from 'fs';
import path from 'path';
import pool from '../db.config/index.js';

const file = path.resolve(process.cwd(), 'data', 'categories_main.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// Map section names to DB category tables (adjust where needed)
const tableMap = {
  'Mass Apps': 'app_category',
  'Video-Mania': 'video_category',
  'Pic Tours': 'pic_category',
  'On-News': 'news_category',
  'Open-Letters': 'disc_category',
  'Q & A': 'qafi_category',
  'CVE': null,
  'Sports & Sports': 'sports_category',
  'Cinematic': 'cinematics_category',
  'Fan-Star Zone': 'fan_star_category',
  'Kid-Vids': 'kid_vids_category',
  'TV ProgMax': 'tv_progmax_category',
  'Learnings & Hobbies': 'learning_hobbies_category',
  'Mondo Market': 'item_category'
};

function isValidTableName(name) {
  return typeof name === 'string' && /^[a-z0-9_]+$/i.test(name);
}

(async ()=>{
  const client = await pool.connect();
  const summary = { inserted: [], skipped: [], errors: [] };
  try {
    for (const section of Object.keys(data)) {
      const table = tableMap[section];
      if (!table) {
        summary.errors.push(`no table mapping for section '${section}'`);
        continue;
      }
      if (!isValidTableName(table)) {
        summary.errors.push(`invalid table name '${table}' for section '${section}'`);
        continue;
      }

      // start per-table transaction
      await client.query('BEGIN');

      // ensure table exists (case-insensitive); create minimal table if missing
      const tRes = await client.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND lower(table_name)=lower($1)`,
        [table]
      ).catch(()=>({rows:[]}));
      const exists = tRes.rows.length>0;
      if (!exists) {
        const createSql = `CREATE TABLE IF NOT EXISTS ${table} (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`;
        await client.query(createSql);
      }

      // fetch existing names
      const rows = await client.query(`SELECT id, name FROM ${table}`).catch(err=>({rows:[]}));
      const existing = new Set((rows.rows||[]).map(r=>r.name));

      for (const name of data[section]) {
        if (!name || String(name).trim()==='') continue;
        if (existing.has(name)) {
          summary.skipped.push({ table, name });
          continue;
        }
        const res = await client.query(`INSERT INTO ${table} (name) VALUES($1) RETURNING id`, [name]);
        summary.inserted.push({ table, name, id: res.rows[0].id });
      }

      await client.query('COMMIT');
    }

    console.log('Insert summary:', JSON.stringify(summary, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error inserting categories:', err);
    await client.query('ROLLBACK').catch(()=>{});
    process.exit(1);
  } finally {
    client.release();
  }
})();
