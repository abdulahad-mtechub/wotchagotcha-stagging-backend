import pool from '../db.config/index.js';

(async ()=>{
  try{
    const subCategoryId = 134; // All others
    const oldDate = '2000-01-01 00:00:00';
    console.log('Updating xpi_videos for sub_category =', subCategoryId);
    const q = `UPDATE xpi_videos SET created_at = $1, updated_at = $1 WHERE sub_category = $2 RETURNING id, created_at`;
    const res = await pool.query(q, [oldDate, subCategoryId]);
    console.log(`Updated ${res.rowCount} row(s)`);
    for(const r of res.rows) console.log(r.id, r.created_at);
    process.exit(0);
  }catch(err){
    console.error('Error:', err);
    process.exit(1);
  }
})();
