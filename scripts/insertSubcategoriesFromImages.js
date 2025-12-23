import fs from 'fs';
import path from 'path';
import pool from '../db.config/index.js';

const mainFile = path.resolve(process.cwd(), 'data', 'main_categories.json');
const subsFile = path.resolve(process.cwd(), 'data', 'subcategories_from_images.json');

const mainData = JSON.parse(fs.readFileSync(mainFile, 'utf8'));
const subsData = JSON.parse(fs.readFileSync(subsFile, 'utf8'));

const dryRun = process.argv.includes('--dry-run');

function subTableFromParent(parentTable) {
  if (!parentTable) return null;
  return parentTable.replace(/_category$/i, '_sub_category');
}

function isValidTableName(name) {
  return /^[a-zA-Z0-9_]+$/.test(name);
}

async function getColumns(client, tableName) {
  const res = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name=$1`,
    [tableName]
  ).catch(()=>({rows:[]}));
  return res.rows.map(r=>r.column_name);
}

(async ()=>{
  const summary = { createdSub: [], skipped: [], missingParents: [], errors: [] };

  // index subs by table+name for quick lookup
  const subsIndex = {};
  for (const m of subsData.modules || []) {
    const key = `${m.table}::${m.name}`.toLowerCase();
    subsIndex[key] = m.subcategories || [];
  }

  for (const mod of mainData.modules || []) {
    const parentTable = mod.table;
    if (!isValidTableName(parentTable)) {
      summary.errors.push(`invalid parent table name: ${parentTable}`);
      continue;
    }

    // use a fresh client/transaction per parent table so one failure won't abort everything
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

        // ensure parent table exists (case-insensitive) or create it
        const parentExistsRes = await client.query(
          `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND lower(table_name)=lower($1)`,
          [parentTable]
        ).catch(()=>({rows:[]}));
        const parentTableExists = parentExistsRes.rows.length > 0;
        if (!parentTableExists) {
          const createParentSql = `CREATE TABLE IF NOT EXISTS ${parentTable} (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`;
          if (dryRun) console.log('DRY RUN create parent table:', createParentSql);
          else await client.query(createParentSql);
        }

        // fetch all rows from parent table
        const rows = await client.query(`SELECT id, name FROM ${parentTable}`).catch(err=>{
          summary.errors.push(`error reading ${parentTable}: ${err.message}`);
          return { rows: [] };
        });

        // ensure parent row for this module exists; insert if missing
        let parentRow = rows.rows.find(r=>r.name === mod.name);
        if (!parentRow) {
          const insertParentSql = `INSERT INTO ${parentTable} (name) VALUES($1) RETURNING id, name`;
          if (dryRun) {
            console.log('DRY RUN insert parent row:', insertParentSql, [mod.name]);
            // simulate id as null for dry-run
            parentRow = { id: null, name: mod.name };
          } else {
            const r = await client.query(insertParentSql, [mod.name]);
            parentRow = r.rows[0];
          }
        }

      const subTable = subTableFromParent(parentTable);
      if (!isValidTableName(subTable)) {
        summary.errors.push(`invalid sub table name derived: ${subTable}`);
        await client.query('ROLLBACK').catch(()=>{});
        client.release();
        continue;
      }

      // ensure sub table exists (case-insensitive) or create it
      const existsRes = await client.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND lower(table_name)=lower($1)`,
        [subTable]
      ).catch(()=>({rows:[]}));
      const tableExists = existsRes.rows.length > 0;
      if (!tableExists) {
        const createSql = `CREATE TABLE IF NOT EXISTS ${subTable} (id SERIAL PRIMARY KEY, category_id INT REFERENCES ${parentTable}(id) ON DELETE CASCADE NOT NULL, name VARCHAR(255) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`;
        if (dryRun) console.log('DRY RUN create sub table:', createSql);
        else await client.query(createSql);
      } else {
        if (dryRun) console.log(`DRY RUN: sub table exists, skipping create: ${subTable}`);
      }

      // get columns to detect FK column
      const cols = await getColumns(client, subTable);
      const fkCandidates = cols.filter(c=>/[_a-z0-9]+id$/i.test(c) && c.toLowerCase() !== 'id');
      const fkColumn = fkCandidates.length? fkCandidates[0] : 'category_id';

      for (const row of rows.rows) {
        const key = `${parentTable}::${row.name}`.toLowerCase();
        const subs = subsIndex[key];
        if (!subs || subs.length === 0) {
          // try match by module name only
          const fallbackKey = `${parentTable}::${mod.name}`.toLowerCase();
          const subs2 = subsIndex[fallbackKey];
          if (!subs2 || subs2.length === 0) {
            summary.missingParents.push({ table: parentTable, parentName: row.name });
            continue;
          }
        }

        const useSubs = subsIndex[key] || subsIndex[`${parentTable}::${mod.name}`.toLowerCase()] || [];
        for (const s of useSubs) {
          if (!s || s.trim()==='') continue;
          // skip existing
          const parentId = parentRow.id || row.id;
          const checkSql = `SELECT id FROM ${subTable} WHERE name=$1 AND ${fkColumn}=$2`;
          const exists = await client.query(checkSql, [s, parentId]).catch(()=>({rows:[]}));
          if (exists.rows.length>0) {
            summary.skipped.push({ table: subTable, name: s, parentId });
            continue;
          }

          const insertSql = `INSERT INTO ${subTable} (${fkColumn}, name) VALUES($1,$2) RETURNING id`;
          if (dryRun) {
            console.log('DRY RUN insert:', insertSql, [parentId, s]);
            summary.createdSub.push({ table: subTable, name: s, parentId, dryRun: true });
          } else {
            const r = await client.query(insertSql, [parentId, s]);
            summary.createdSub.push({ table: subTable, name: s, parentId, id: r.rows[0].id });
            console.log(`Inserted ${s} into ${subTable} (id=${r.rows[0].id})`);
          }
        }
      }

      if (dryRun) await client.query('ROLLBACK');
      else await client.query('COMMIT');
    } catch (err) {
      summary.errors.push(`table ${parentTable} failed: ${err.message}`);
      await client.query('ROLLBACK').catch(()=>{});
    } finally {
      client.release();
    }
  }

  console.log('\nSummary:', JSON.stringify(summary, null, 2));
  process.exit(0);
})();
