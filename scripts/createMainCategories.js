import fs from 'fs';
import path from 'path';
import pool from '../db.config/index.js';

const filePath = path.resolve(process.cwd(), 'data', 'main_categories.json');
const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

const dryRun = process.argv.includes('--dry-run');

function isValidTableName(name) {
  return /^[a-z0-9_]+$/.test(name);
}

(async () => {
  const client = await pool.connect();
  const summary = { inserted: [], skipped: [], errors: [] };
  try {
    await client.query('BEGIN');

    for (const mod of data.modules) {
      const name = mod.name.trim();
      const table = mod.table.trim();

      if (!isValidTableName(table)) {
        const msg = `Invalid table name '${table}' for module '${name}'`;
        summary.errors.push(msg);
        console.error(msg);
        continue;
      }

      // check if exists
      const checkSql = `SELECT id FROM ${table} WHERE name=$1`;
      const exists = await client.query(checkSql, [name]);
      if (exists.rows.length > 0) {
        summary.skipped.push({ table, name, id: exists.rows[0].id });
        console.log(`Skipped existing: ${table} -> ${name} (id=${exists.rows[0].id})`);
        continue;
      }

      const insertSql = `INSERT INTO ${table} (name) VALUES($1) RETURNING id`;
      if (dryRun) {
        console.log(`DRY RUN: ${insertSql} -- params:`, [name]);
        summary.inserted.push({ table, name, dryRun: true });
        continue;
      }

      const res = await client.query(insertSql, [name]);
      const insertedId = res.rows[0].id;
      summary.inserted.push({ table, name, id: insertedId });
      console.log(`Inserted: ${table} -> ${name} (id=${insertedId})`);
    }

    if (dryRun) {
      await client.query('ROLLBACK');
      console.log('\nDry run complete — no changes committed.');
    } else {
      await client.query('COMMIT');
      console.log('\nAll main categories inserted and transaction committed.');
    }

    console.log('\nSummary:', JSON.stringify(summary, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error during insertion, rolling back:', err);
    await client.query('ROLLBACK');
    process.exit(1);
  } finally {
    client.release();
  }
})();
