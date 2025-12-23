import fs from 'fs';
import path from 'path';
import pool from '../db.config/index.js';

const file = path.resolve(process.cwd(), 'data', 'categories_to_insert.json');
if (!fs.existsSync(file)) {
  console.error('Data file not found:', file);
  process.exit(1);
}

const frenchFile = path.resolve(process.cwd(), 'data', 'categories_french_by_table.json');
const frenchData = fs.existsSync(frenchFile) ? JSON.parse(fs.readFileSync(frenchFile, 'utf8')) : {};

const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// Map section names to DB category tables
const tableMap = {
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

function isValidTableName(name) {
  return typeof name === 'string' && /^[a-z0-9_]+$/i.test(name);
}

function detectFrenchColumn(columns) {
  // prefer these names in order
  const candidates = ['french_name','french_title','name_fr','fr_name','french','name_fr_en'];
  const lowerCols = columns.map(c=>c.toLowerCase());
  for (const cand of candidates) {
    const idx = lowerCols.indexOf(cand.toLowerCase());
    if (idx !== -1) return columns[idx];
  }
  // fallback: any column containing 'fr' or 'french'
  for (let i=0;i<lowerCols.length;i++){
    if (lowerCols[i].includes('french') || lowerCols[i].includes('fr_') || lowerCols[i].endsWith('_fr') || lowerCols[i].includes('_fr')) return columns[i];
  }
  return null;
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

      await client.query('BEGIN');

      // ensure table exists; create a minimal table if missing
      const tRes = await client.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND lower(table_name)=lower($1)`,
        [table]
      ).catch(()=>({rows:[]}));
      const exists = tRes.rows.length>0;
      if (!exists) {
        const createSql = `CREATE TABLE IF NOT EXISTS ${table} (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`;
        await client.query(createSql);
      }

      // get columns for this table
      const colRes = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND lower(table_name)=lower($1)`,
        [table]
      ).catch(()=>({rows:[]}));
      const columns = (colRes.rows||[]).map(r=>r.column_name);
      let frenchCol = detectFrenchColumn(columns);
      // if french name exists in our mapping but column missing, add french_name column
      const frenchMapping = frenchData[table] || {};
      const needsFrench = Object.keys(frenchMapping).length>0;
      if (needsFrench && !frenchCol) {
        frenchCol = 'french_name';
        await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${frenchCol} VARCHAR(255)`);
      }

      // fetch existing names to avoid uniqueness conflict; we'll still insert new records
      const rows = await client.query(`SELECT id, name FROM ${table}`).catch(()=>({rows:[]}));
      const existing = new Set((rows.rows||[]).map(r=>r.name));

      for (const name of data[section]) {
        if (!name || String(name).trim()==='') continue;
        const frenchName = frenchMapping[name] || null;
        let insertName = name;
        if (existing.has(name)) {
          // avoid linking with previous records: make a distinct name by appending timestamp
          insertName = `${name} [seeded ${new Date().toISOString()}]`;
        }

        if (frenchCol && frenchName) {
          const insertSql = `INSERT INTO ${table} (name, ${frenchCol}) VALUES($1,$2) RETURNING id`;
          const res = await client.query(insertSql, [insertName, frenchName]);
          summary.inserted.push({ table, original: name, inserted_as: insertName, french: frenchName, id: res.rows[0].id });
        } else {
          const res = await client.query(`INSERT INTO ${table} (name) VALUES($1) RETURNING id`, [insertName]);
          summary.inserted.push({ table, original: name, inserted_as: insertName, id: res.rows[0].id });
        }
      }

      await client.query('COMMIT');
    }

    console.log('Insert summary:', JSON.stringify(summary, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error inserting categories:', err.message || err);
    await client.query('ROLLBACK').catch(()=>{});
    process.exit(1);
  } finally {
    client.release();
  }
})();
