import pool from '../db.config/index.js';
import fs from 'fs';
const mapping = JSON.parse(fs.readFileSync(new URL('../data/subcategories_by_table.json', import.meta.url)));

const argv = process.argv.slice(2);
const dry = argv.includes('--dry-run');

async function insertForTable(table){
  const tableMap = mapping[table];
  if(!tableMap) return console.log(`${table}: no mapping, skipping`);
  for(const parentName of Object.keys(tableMap)){
    const subs = tableMap[parentName];
    try{
      const res = await pool.query(`SELECT id FROM ${table} WHERE name=$1 LIMIT 1`, [parentName]);
      if(res.rows.length===0){
        console.log(`${table}: parent '${parentName}' not found, skipping`);
        continue;
      }
      const parentId = res.rows[0].id;
      const subTable = table.replace(/_category$/, '_sub_category');
      for(const s of subs){
        const exists = await pool.query(`SELECT id FROM ${subTable} WHERE name=$1 AND category_id=$2 LIMIT 1`, [s.name, parentId]);
        if(exists.rows.length>0){
          console.log(`${subTable}: already has '${s.name}' for parent '${parentName}'`);
          continue;
        }
        if(dry){
          console.log(`WOULD INSERT: ${subTable} name='${s.name}' french_name='${s.french_name}' category_id=${parentId} (parent='${parentName}')`);
        }else{
          await pool.query('BEGIN');
          await pool.query(`INSERT INTO ${subTable}(name,french_name,category_id,created_at,updated_at) VALUES($1,$2,$3,NOW(),NOW())`, [s.name, s.french_name, parentId]);
          await pool.query('COMMIT');
          console.log(`INSERTED: ${subTable} '${s.name}' -> parent '${parentName}'`);
        }
      }
    }catch(err){
      console.error(`${table}: ERROR - ${err.message}`);
    }
  }
}

async function main(){
  const tables = Object.keys(mapping);
  console.log(dry? 'Running dry-run (no changes)' : 'Applying mapped inserts');
  for(const t of tables) await insertForTable(t);
  console.log('Done');
  process.exit(0);
}

main().catch(e=>{ console.error(e); process.exit(1); });
