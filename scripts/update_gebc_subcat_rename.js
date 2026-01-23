import pool from '../db.config/index.js';

(async ()=>{
  try{
    const oldName = 'Emotions & Feelings  Actions & Reactions  Objects & Places';
    const newName = 'Emotions Thoughts Actions Objects';

    console.log('Searching for GEBC subcategories with exact name:', oldName);
    const sel = await pool.query('SELECT id, name FROM GEBC_sub_category WHERE name = $1', [oldName]);
    console.log(`Found ${sel.rowCount} row(s)`);
    if(sel.rowCount === 0){
      process.exit(0);
    }

    const upd = await pool.query('UPDATE GEBC_sub_category SET name = $1, updated_at = NOW() WHERE name = $2 RETURNING id, name', [newName, oldName]);
    console.log(`Updated ${upd.rowCount} row(s):`);
    for(const r of upd.rows) console.log(r.id, r.name);
    process.exit(0);
  }catch(err){
    console.error('Error:', err);
    process.exit(1);
  }
})();
