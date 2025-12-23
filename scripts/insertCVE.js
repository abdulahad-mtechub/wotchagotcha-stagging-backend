import fs from 'fs';
import path from 'path';
import pool from '../db.config/index.js';

const file = path.resolve(process.cwd(), 'data', 'categories_main.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const names = data['CVE'] || [];

(async ()=>{
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const table = 'cve_category';

    // create table if missing
    const createSql = `CREATE TABLE IF NOT EXISTS ${table} (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`;
    await client.query(createSql);

    const existingRes = await client.query(`SELECT name FROM ${table}`);
    const existing = new Set(existingRes.rows.map(r=>r.name));

    const inserted = [];
    const skipped = [];

    for (const n of names) {
      if (!n || String(n).trim() === '') continue;
      if (existing.has(n)) {
        skipped.push(n);
        continue;
      }
      const r = await client.query(`INSERT INTO ${table} (name) VALUES($1) RETURNING id`, [n]);
      inserted.push({ name: n, id: r.rows[0].id });
    }

    await client.query('COMMIT');
    console.log('Inserted:', JSON.stringify(inserted, null, 2));
    if (skipped.length) console.log('Skipped (already exist):', JSON.stringify(skipped));
    process.exit(0);
  } catch (err) {
    console.error('Error inserting CVE categories:', err.message || err);
    await client.query('ROLLBACK').catch(()=>{});
    process.exit(1);
  } finally {
    client.release();
  }
})();
