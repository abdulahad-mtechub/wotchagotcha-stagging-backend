import pool from '../db.config/index.js';
import fs from 'fs';
import process from 'process';

const mappingPath = 'data/categories_french_by_table.json';

function loadMapping() {
  if (!fs.existsSync(mappingPath)) throw new Error(`Mapping not found: ${mappingPath}`);
  return JSON.parse(fs.readFileSync(mappingPath).toString());
}

async function dryRun(mapping) {
  console.log('Dry-run: show planned updates for table-specific mappings');
  for (const [table, map] of Object.entries(mapping)) {
    for (const [eng, fr] of Object.entries(map)) {
      try {
        const res = await pool.query(`SELECT COUNT(*)::int AS cnt FROM ${table} WHERE name = $1`, [eng]);
        if (res.rows[0].cnt > 0) console.log(`${table}: ${res.rows[0].cnt} row(s) name='${eng}' -> french_name='${fr}'`);
      } catch (err) {
        if (!/does not exist/.test(err.message)) console.error(`${table}: ERROR — ${err.message}`);
      }
    }
  }
}

async function apply(mapping) {
  const client = await pool.connect();
  try {
    for (const [table, map] of Object.entries(mapping)) {
      try {
        await client.query('BEGIN');
        try {
          await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS french_name VARCHAR(255)`);
        } catch (err) {
          if (/does not exist/.test(err.message)) {
            console.warn(`${table}: table not found, skipping`);
            await client.query('ROLLBACK');
            continue;
          }
          throw err;
        }
        for (const [eng, fr] of Object.entries(map)) {
          try {
            const res = await client.query(`UPDATE ${table} SET french_name = $1 WHERE name = $2 RETURNING id`, [fr, eng]);
            if (res.rowCount > 0) console.log(`${table}: updated ${res.rowCount} row(s) where name='${eng}' -> '${fr}'`);
          } catch (err) {
            if (!/does not exist/.test(err.message)) {
              console.error(`${table}: ERROR during update — ${err.message}`);
              throw err;
            }
          }
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`${table}: rolled back due to error: ${err.message}`);
        // continue with next table
      }
    }
    console.log('Finished attempting all table-specific mappings');
  } finally {
    client.release();
  }
}

async function main() {
  const mapping = loadMapping();
  const dry = process.argv.includes('--dry-run') || process.argv.includes('-d');
  if (dry) {
    await dryRun(mapping);
    process.exit(0);
  }
  console.log('Applying table-specific French mappings');
  await apply(mapping);
  process.exit(0);
}

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });
