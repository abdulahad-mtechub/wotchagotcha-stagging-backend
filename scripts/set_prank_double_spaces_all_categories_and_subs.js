import pool from '../db.config/index.js';

(async ()=>{
  try{
    const target = 'Prank Fun Creativity Entertainment';
    const tables = [
      // categories
      { table: 'video_category', col: 'name' },
      { table: 'pic_category', col: 'name' },
      { table: 'NEWS_category', col: 'name' },
      { table: 'fan_star_category', col: 'name' },
      { table: 'tv_progmax_category', col: 'name' },
      { table: 'kid_vids_category', col: 'name' },
      { table: 'learning_hobbies_category', col: 'name' },
      { table: 'item_category', col: 'name' },
      { table: 'disc_category', col: 'name' },
      { table: 'gebc_category', col: 'name' },
      // subcategories
      { table: 'video_sub_category', col: 'name' },
      { table: 'pic_sub_category', col: 'name' },
      { table: 'NEWS_sub_category', col: 'name' },
      { table: 'fan_star_sub_category', col: 'name' },
      { table: 'tv_progmax_sub_category', col: 'name' },
      { table: 'kid_vids_sub_category', col: 'name' },
      { table: 'learning_hobbies_sub_category', col: 'name' },
      { table: 'item_sub_category', col: 'name' },
      { table: 'disc_sub_category', col: 'name' },
      { table: 'gebc_sub_category', col: 'name' }
    ];

    console.log('Searching (normalized) for matches to:', target);

    for(const t of tables){
      try{
        const selectQ = `SELECT id, ${t.col} FROM ${t.table} WHERE lower(regexp_replace(${t.col}, '\\s+', ' ', 'g')) = lower($1)`;
        const sel = await pool.query(selectQ, [target]);
        if(sel.rowCount === 0){
          console.log(`${t.table}: no matches`);
          continue;
        }
        console.log(`${t.table}: found ${sel.rowCount} match(es) -> IDs: ${sel.rows.map(r=>r.id).join(', ')}`);

        // Normalize whitespace, then replace single space with two spaces
        const updateQ = `UPDATE ${t.table}
                         SET ${t.col} = regexp_replace(regexp_replace(${t.col}, '\\s+', ' ', 'g'), ' ', '  ', 'g')
                         WHERE lower(regexp_replace(${t.col}, '\\s+', ' ', 'g')) = lower($1)
                         RETURNING id, ${t.col}`;
        const upd = await pool.query(updateQ, [target]);
        console.log(`${t.table}: updated ${upd.rowCount} row(s)`);
        for(const r of upd.rows) console.log('  ', r.id, r[t.col]);
      }catch(e){
        console.error(`Error on table ${t.table}:`, e.message || e);
      }
    }

    console.log('Done');
    process.exit(0);
  }catch(err){
    console.error('Fatal error:', err);
    process.exit(1);
  }
})();
