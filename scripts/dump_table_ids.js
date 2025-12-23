import pool from '../db.config/index.js';

const table = process.argv[2];
if(!table){
  console.error('Usage: node scripts/dump_table_ids.js <table_name>');
  process.exit(2);
}

async function dump(){
  try{
    const res = await pool.query(`SELECT id,name,french_name FROM ${table} ORDER BY id`);
    console.log(`Table: ${table}`);
    for(const r of res.rows){
      console.log(`${r.id} | ${r.name}${r.french_name? ` / ${r.french_name}` : ''}`);
    }
    process.exit(0);
  }catch(err){
    console.error(err.message);
    process.exit(1);
  }
}

dump();
