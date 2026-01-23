import pool from '../db.config/index.js';

(async ()=>{
  try{
    const oldDate = '2000-01-01 00:00:00';
    console.log("Updating 'All others' items in multiple module tables...\n");
    
    const tables = [
      { name: 'fan_star_videos', subcatColumn: 'sub_category_id' },
      { name: 'pic_tours', subcatColumn: 'sub_category' },
      { name: 'NEWS', subcatColumn: 'sub_category' },
      { name: 'tv_progmax_videos', subcatColumn: 'sub_category_id' },
      { name: 'post_letters', subcatColumn: 'disc_sub_category' }
    ];
    
    for (const table of tables) {
      // First, find the "All others" subcategory IDs
      const subcatTableMap = {
        'fan_star_videos': 'fan_star_sub_category',
        'pic_tours': 'pic_sub_category',
        'NEWS': 'NEWS_sub_category',
        'tv_progmax_videos': 'tv_progmax_sub_category',
        'post_letters': 'disc_sub_category'
      };
      
      const subcatTable = subcatTableMap[table.name];
      const findSubcatQuery = `SELECT id FROM ${subcatTable} WHERE lower(name) = lower($1)`;
      const subcatResult = await pool.query(findSubcatQuery, ['All others']);
      
      if (subcatResult.rowCount === 0) {
        console.log(`${table.name}: No "All others" subcategory found, skipping.`);
        continue;
      }
      
      const allOthersIds = subcatResult.rows.map(r => r.id);
      console.log(`${table.name}: Found ${allOthersIds.length} "All others" subcategory ID(s): ${allOthersIds.join(', ')}`);
      
      // Update items in this table
      const q = `UPDATE ${table.name} SET created_at = $1, updated_at = $1 WHERE ${table.subcatColumn} = ANY($2::int[]) RETURNING id, created_at`;
      const res = await pool.query(q, [oldDate, allOthersIds]);
      console.log(`${table.name}: Updated ${res.rowCount} row(s)\n`);
    }
    
    console.log('All updates complete!');
    process.exit(0);
  }catch(err){
    console.error('Error:', err);
    process.exit(1);
  }
})();
