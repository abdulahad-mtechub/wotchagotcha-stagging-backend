import pool from '../db.config/index.js';

(async ()=>{
  try{
    const oldDate = '2000-01-01 00:00:00';
    console.log("Updating video_sub_category rows named 'All others'...");
    const q = `UPDATE video_sub_category SET created_at = $1, updated_at = $1 WHERE lower(name) = lower($2) RETURNING id, name, created_at`;
    const res = await pool.query(q, [oldDate, 'All others']);
    console.log(`Updated ${res.rowCount} row(s)`);
    for(const r of res.rows) console.log(r.id, r.name, r.created_at);
    process.exit(0);
  }catch(err){
    console.error('Error:', err);
    process.exit(1);
  }
})();
