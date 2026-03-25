import pool from '../db.config/index.js';
import process from 'process';

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

async function dryRun() {
  for (const t of tables) {
    try {
      // ensure column exists for the dry-run check (no-op if column exists)
      try {
        await pool.query(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS french_name VARCHAR(255)`);
      } catch (e) {
        // ignore errors from ALTER in dry-run; we'll report if table missing
      }
      const res = await pool.query(`SELECT COUNT(*)::int AS to_update FROM ${t} WHERE french_name IS NULL OR trim(french_name) = ''`);
      console.log(`${t}: ${res.rows[0].to_update} rows would be updated`);
    } catch (err) {
      console.error(`${t}: ERROR — ${err.message}`);
    }
  }
}

async function applyUpdates() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const t of tables) {
      try {
        await client.query(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS french_name VARCHAR(255)`);
        const res = await client.query(`UPDATE ${t} SET french_name = name WHERE french_name IS NULL OR trim(french_name) = '' RETURNING id`);
        console.log(`${t}: updated ${res.rowCount} rows`);
      } catch (err) {
        console.error(`${t}: ERROR during update — ${err.message}`);
        throw err;
      }
    }
    await client.query('COMMIT');
    console.log('All updates committed');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction rolled back due to error');
  } finally {
    client.release();
  }
}

async function main() {
  const dry = process.argv.includes('--dry-run') || process.argv.includes('-d');
  if (dry) {
    console.log('Running in dry-run mode (no changes will be made)');
    await dryRun();
    process.exit(0);
  }
  console.log('Applying updates to set french_name = name where empty');
  await applyUpdates();
  process.exit(0);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
