import fs from 'fs';
import path from 'path';
import pool from '../db.config/index.js';

const mainFile = path.resolve(process.cwd(), 'data', 'main_categories.json');
const mainData = JSON.parse(fs.readFileSync(mainFile, 'utf8'));

const confirm = process.argv.includes('--yes');

function subTableFromParent(parentTable) {
  return parentTable.replace(/_category$/i, '_sub_category');
}

function quoteIdent(name) {
  return '"' + name.replace(/"/g, '""') + '"';
}

(async ()=>{
  const client = await pool.connect();
  try {
    // build candidate tables
    const parentTables = (mainData.modules||[]).map(m=>m.table).filter(Boolean);
    const candidateTables = new Set();
    for (const p of parentTables) {
      candidateTables.add(p);
      candidateTables.add(subTableFromParent(p));
    }

    // resolve existing table names (case-insensitive)
    const found = [];
    for (const t of Array.from(candidateTables)) {
      const res = await client.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND lower(table_name)=lower($1)`,
        [t]
      );
      if (res.rows.length>0) found.push(res.rows[0].table_name);
    }

    if (found.length === 0) {
      console.log('No matching category/subcategory tables found to clear.');
      process.exit(0);
    }

    console.log('The following tables will be TRUNCATED (RESTART IDENTITY, CASCADE):');
    for (const n of found) console.log('-', n);

    if (!confirm) {
      console.log('\nThis is a destructive operation. To proceed, re-run with:');
      console.log('\n  node scripts/clearCategoryTables.js --yes\n');
      process.exit(0);
    }

    // perform truncation
    for (const n of found) {
      const sql = `TRUNCATE TABLE ${quoteIdent(n)} RESTART IDENTITY CASCADE`;
      console.log('Executing:', sql);
      await client.query(sql);
    }

    console.log('\nAll specified category and subcategory tables truncated.');
    process.exit(0);
  } catch (err) {
    console.error('Error while clearing tables:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
})();
