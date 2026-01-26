import pool from '../db.config/index.js';

(async ()=>{
  try{
    const categoryId = 1;
    const q = `SELECT id, name, created_at, updated_at FROM sport_sub_category WHERE category_id = $1 ORDER BY created_at DESC`;
    const res = await pool.query(q, [categoryId]);
    console.log(`Found ${res.rowCount} rows for category_id=${categoryId}`);
    for(const r of res.rows){
      console.log(r.id, r.name, r.created_at, r.updated_at);
    }
    process.exit(0);
  }catch(err){
    console.error(err);
    process.exit(1);
  }
})();
