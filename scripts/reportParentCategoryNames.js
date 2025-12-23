import pool from '../db.config/index.js';

const pairs = [
  {cat:'video_category', sub:'video_sub_category'},
  {cat:'pic_category', sub:'pic_sub_category'},
  {cat:'NEWS_category', sub:'NEWS_sub_category'},
  {cat:'cinematics_category', sub:'cinematics_sub_category'},
  {cat:'fan_star_category', sub:'fan_star_sub_category'},
  {cat:'tv_progmax_category', sub:'tv_progmax_sub_category'},
  {cat:'kid_vids_category', sub:'kid_vids_sub_category'},
  {cat:'learning_hobbies_category', sub:'learning_hobbies_sub_category'},
  {cat:'sports_category', sub:'sport_sub_category'},
  {cat:'QAFI_category', sub:'QAFI_sub_category'},
  {cat:'GEBC_category', sub:'GEBC_sub_category'}
];

async function report(){
  console.log('Parent → subcategories report (read-only)');
  for(const p of pairs){
    try{
      const parents = await pool.query(`SELECT id,name,french_name FROM ${p.cat} ORDER BY id`);
      if(parents.rows.length===0){ console.log(`\n${p.cat}: (no rows)`); continue; }
      console.log(`\n=== ${p.cat} ===`);
      for(const parent of parents.rows){
        try{
          const subs = await pool.query(`SELECT id,name,french_name FROM ${p.sub} WHERE category_id=$1 ORDER BY id`, [parent.id]);
          const names = subs.rows.map(r=>`${r.name}${r.french_name? ` (${r.french_name})` : ''}`);
          console.log(`- ${parent.id} | ${parent.name}${parent.french_name? ` / ${parent.french_name}`: ''} -> [${names.join(', ')}]`);
        }catch(err){
          if(/does not exist/.test(err.message)) { console.log(`${p.sub}: (table not found)`); break; }
          console.error(`${p.sub}: ERROR - ${err.message}`);
          break;
        }
      }
    }catch(err){
      if(/does not exist/.test(err.message)) console.log(`${p.cat}: (table not found)`);
      else console.error(`${p.cat}: ERROR - ${err.message}`);
    }
  }
  process.exit(0);
}

report().catch(e=>{ console.error(e); process.exit(1); });
