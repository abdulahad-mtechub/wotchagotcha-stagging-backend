import pool from '../db.config/index.js';

(async ()=>{
  try{
    const categoryId = 21;
    const subQ = `SELECT id, name, created_at FROM video_sub_category WHERE name ILIKE 'All others' AND category_id = $1`;
    const subRes = await pool.query(subQ, [categoryId]);
    if(subRes.rowCount===0){
      console.log('No "All others" subcategory found for category', categoryId);
      process.exit(0);
    }
    for(const s of subRes.rows){
      console.log('Subcategory:', s.id, s.name, s.created_at);
      const vq = `SELECT id AS video_id, name, created_at FROM xpi_videos WHERE sub_category = $1 ORDER BY created_at DESC`;
      const vres = await pool.query(vq, [s.id]);
      console.log(`  Found ${vres.rowCount} videos for subcategory id=${s.id}`);
      for(const v of vres.rows){
        console.log('   ', v.video_id, v.name, v.created_at);
      }
    }
    process.exit(0);
  }catch(err){
    console.error(err);
    process.exit(1);
  }
})();
