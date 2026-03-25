import fs from 'fs';
import path from 'path';
import pool from '../db.config/index.js';

const filePath = path.resolve(process.cwd(), 'data', 'categories.json');
const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

const dryRun = process.argv.includes('--dry-run');

function subTableFromParent(parentTable) {
  if (!parentTable) return null;
  // examples: video_category -> video_sub_category
  return parentTable.replace(/_category$/i, '_sub_category');
}

function isValidTableName(name) {
  return /^[a-z0-9_]+$/i.test(name);
}

async function tableExists(client, tableName) {
  const res = await client.query(
    `SELECT to_regclass($1) AS exists`,
    [tableName]
  );
  return res.rows[0].exists !== null;
}

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const summary = { parentsCreated: [], parentsFound: [], subCreated: [], subSkipped: [], errors: [] };

    for (const mod of data.modules) {
      const parentTable = mod.table;
      const parentName = mod.name;
      const subNames = mod.subcategories || [];

      if (!isValidTableName(parentTable)) {
        summary.errors.push(`Invalid parent table name: ${parentTable}`);
        continue;
      }

      const parentExists = await tableExists(client, parentTable);
      if (!parentExists) {
        const createParentSql = `CREATE TABLE IF NOT EXISTS ${parentTable} (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`;
        if (dryRun) {
          console.log('DRY RUN create parent table:', createParentSql);
        } else {
          await client.query(createParentSql);
          console.log('Created parent table:', parentTable);
        }
      }

      // ensure parent row exists, insert if missing
      let parentRow = null;
      const found = await client.query(`SELECT id FROM ${parentTable} WHERE name=$1`, [parentName]);
      if (found.rows.length > 0) {
        parentRow = found.rows[0];
        summary.parentsFound.push({ parentTable, name: parentName, id: parentRow.id });
      } else {
        const insertParentSql = `INSERT INTO ${parentTable} (name) VALUES($1) RETURNING id`;
        if (dryRun) {
          console.log('DRY RUN insert parent:', insertParentSql, [parentName]);
          parentRow = { id: null };
          summary.parentsCreated.push({ parentTable, name: parentName, dryRun: true });
        } else {
          const r = await client.query(insertParentSql, [parentName]);
          parentRow = r.rows[0];
          summary.parentsCreated.push({ parentTable, name: parentName, id: parentRow.id });
        }
      }

      // create sub table if missing
      const subTable = subTableFromParent(parentTable);
      if (!isValidTableName(subTable)) {
        summary.errors.push(`Invalid sub table for parent ${parentTable}: ${subTable}`);
        continue;
      }

      const subExists = await tableExists(client, subTable);
      if (!subExists) {
        const createSubSql = `CREATE TABLE IF NOT EXISTS ${subTable} (id SERIAL PRIMARY KEY, category_id INT REFERENCES ${parentTable}(id) ON DELETE CASCADE NOT NULL, name VARCHAR(255) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`;
        if (dryRun) {
          console.log('DRY RUN create sub table:', createSubSql);
        } else {
          await client.query(createSubSql);
          console.log('Created sub table:', subTable);
        }
      }

      // insert subcategories
      for (const subName of subNames) {
        if (!subName || subName.trim() === '') continue;
        // skip if already exists for this parent
        const checkSql = `SELECT id FROM ${subTable} WHERE name=$1 AND category_id=$2`;
        const checkParams = [subName, parentRow.id];
        const exists = await client.query(checkSql, checkParams).catch(()=>({rows:[]}));
        if (exists.rows.length > 0) {
          summary.subSkipped.push({ subTable, name: subName, id: exists.rows[0].id });
          continue;
        }

        const insertSql = `INSERT INTO ${subTable} (category_id, name) VALUES($1, $2) RETURNING id`;
        if (dryRun) {
          console.log('DRY RUN insert sub:', insertSql, [parentRow.id, subName]);
          summary.subCreated.push({ subTable, name: subName, dryRun: true });
        } else {
          const r = await client.query(insertSql, [parentRow.id, subName]);
          summary.subCreated.push({ subTable, name: subName, id: r.rows[0].id });
          console.log(`Inserted subcategory into ${subTable}: ${subName} (id=${r.rows[0].id})`);
        }
      }
    }

    if (dryRun) {
      await client.query('ROLLBACK');
      console.log('\nDry run complete — no changes committed.');
    } else {
      await client.query('COMMIT');
      console.log('\nAll subcategories inserted and transaction committed.');
    }

    console.log('\nSummary:', JSON.stringify(summary, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error, rolling back:', err);
    await client.query('ROLLBACK');
    process.exit(1);
  } finally {
    client.release();
  }
})();
