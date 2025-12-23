import pool from '../db.config/index.js';

const table = process.argv[2];
const categoryId = process.argv[3];
if(!table || !categoryId){
  console.error('Usage: node scripts/dump_subs_for_category.js <sub_table> <category_id>');
  process.exit(2);
}

async function run(){
  try{
    const res = await pool.query(`SELECT id,name,french_name,category_id FROM ${table} WHERE category_id=$1 ORDER BY id`, [categoryId]);
    console.log(`Sub-table: ${table} for category_id=${categoryId}`);
    for(const r of res.rows) console.log(`${r.id} | ${r.name}${r.french_name? ` / ${r.french_name}` : ''} | category_id=${r.category_id}`);
    process.exit(0);
  }catch(err){
    console.error(err.message);
    process.exit(1);
  }
}

run();
