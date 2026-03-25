import pool from '../db.config/index.js';
import fs from 'fs';
import process from 'process';

const mappingPath = 'data/categories_french.json';
const tables = [
  'app_category',
  'item_category',
  'disc_category',
  'video_category',
  'pic_category',
  'QAFI_category',
  'GEBC_category',
  'NEWS_category',
  'cinematics_category',
  'fan_star_category',
  'tv_progmax_category',
  'kid_vids_category',
  'learning_hobbies_category',
  'sports_category'
];

function loadMapping() {
  if (!fs.existsSync(mappingPath)) {
    throw new Error(`Mapping file not found: ${mappingPath}`);
  }
  const raw = fs.readFileSync(mappingPath).toString();
  return JSON.parse(raw);
}

async function dryRun(mapping) {
  console.log('Dry-run: preview updates (no DB changes)');
  for (const [eng, fr] of Object.entries(mapping)) {
    for (const t of tables) {
      try {
        // count matching rows
        const res = await pool.query(`SELECT COUNT(*)::int AS cnt FROM ${t} WHERE name = $1` , [eng]);
        if (res.rows[0].cnt > 0) {
          console.log(`${t}: ${res.rows[0].cnt} row(s) where name='${eng}' would be set to french_name='${fr}'`);
        }
      } catch (err) {
        // ignore missing table errors
        if (!/does not exist/.test(err.message)) {
          console.error(`${t}: ERROR — ${err.message}`);
        }
      }
    }
  }
}

async function apply(mapping) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [eng, fr] of Object.entries(mapping)) {
      for (const t of tables) {
        try {
          await client.query(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS french_name VARCHAR(255)`);
          const res = await client.query(`UPDATE ${t} SET french_name = $1 WHERE name = $2 RETURNING id`, [fr, eng]);
          if (res.rowCount > 0) {
            console.log(`${t}: updated ${res.rowCount} row(s) where name='${eng}' -> '${fr}'`);
          }
        } catch (err) {
          if (!/does not exist/.test(err.message)) {
            console.error(`${t}: ERROR during update — ${err.message}`);
            throw err;
          }
        }
      }
    }
    await client.query('COMMIT');
    console.log('Mapping applied and committed');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction rolled back due to error');
    throw err;
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
  console.log('Applying French mapping to main category tables');
  await apply(mapping);
  process.exit(0);
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
