import pool from '../db.config/index.js';

(async ()=>{
  try{
    const q = `SELECT id, name, category_id, created_at FROM fan_star_sub_category ORDER BY created_at DESC LIMIT 30`;
    const res = await pool.query(q);
    console.log(`Found ${res.rowCount} rows in fan_star_sub_category`);
    for(const r of res.rows){
      console.log(r.id, r.name, r.category_id, r.created_at.toISOString());
    }
    process.exit(0);
  }catch(err){
    console.error(err);
    process.exit(1);
  }
})();
