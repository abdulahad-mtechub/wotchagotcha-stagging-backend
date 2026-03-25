import pool from '../db.config/index.js';
import fs from 'fs';

const mapping = JSON.parse(fs.readFileSync(new URL('../data/subcategories_by_table.json', import.meta.url)));
const defaultSubs = JSON.parse(fs.readFileSync(new URL('../data/default_subs.json', import.meta.url)));
const argv = process.argv.slice(2);
const dry = argv.includes('--dry-run');

const tablePairs = [
  {category:'video_category', sub:'video_sub_category'},
  {category:'pic_category', sub:'pic_sub_category'},
  {category:'NEWS_category', sub:'NEWS_sub_category'},
  {category:'cinematics_category', sub:'cinematics_sub_category'},
  {category:'fan_star_category', sub:'fan_star_sub_category'},
  {category:'tv_progmax_category', sub:'tv_progmax_sub_category'},
  {category:'kid_vids_category', sub:'kid_vids_sub_category'},
  {category:'learning_hobbies_category', sub:'learning_hobbies_sub_category'},
  {category:'sports_category', sub:'sport_sub_category'},
  {category:'QAFI_category', sub:'QAFI_sub_category'},
  {category:'GEBC_category', sub:'GEBC_sub_category'},
  {category:'disc_category', sub:'disc_sub_category'},
  {category:'app_category', sub:'app_sub_category'},
  {category:'item_category', sub:'item_sub_category'}
];

async function ensureForPair(pair){
  try{
    const catRes = await pool.query(`SELECT id,name FROM ${pair.category} ORDER BY id`);
    if(catRes.rows.length===0) return console.log(`${pair.category}: no parent rows`);
    for(const parent of catRes.rows){
      try{
        const cnt = await pool.query(`SELECT COUNT(*) AS c FROM ${pair.sub} WHERE category_id=$1`, [parent.id]);
        if(parseInt(cnt.rows[0].c) > 0) continue; // already has subcats
      }catch(e){
        if(/does not exist/.test(e.message)) { console.log(`${pair.sub}: table not found, skipping parents of ${pair.category}`); break; }
        console.error(`${pair.category}/${pair.sub}: ERROR checking subcats - ${e.message}`); continue;
      }

      // choose subs: mapping first, else default
      const tableMap = mapping[pair.category] || {};
      const mapped = tableMap[parent.name];
      const subsToInsert = mapped && mapped.length>0 ? mapped : (defaultSubs.defaults || []);

      if(!subsToInsert || subsToInsert.length===0){
        console.log(`${pair.category} -> ${parent.name}: no mapping and no defaults, skipping`);
        continue;
      }

      for(const s of subsToInsert){
        try{
          const exists = await pool.query(`SELECT id FROM ${pair.sub} WHERE name=$1 AND category_id=$2 LIMIT 1`, [s.name, parent.id]);
          if(exists.rows.length>0){ console.log(`${pair.sub}: already has '${s.name}' for parent '${parent.name}'`); continue; }
          if(dry){
            console.log(`WOULD INSERT: ${pair.sub} name='${s.name}' french_name='${s.french_name||s.frenchName||''}' category_id=${parent.id} (parent='${parent.name}')`);
          }else{
            await pool.query('BEGIN');
            await pool.query(`INSERT INTO ${pair.sub}(name,french_name,category_id,created_at,updated_at) VALUES($1,$2,$3,NOW(),NOW())`, [s.name, s.french_name||s.frenchName||null, parent.id]);
            await pool.query('COMMIT');
            console.log(`INSERTED: ${pair.sub} '${s.name}' -> parent '${parent.name}'`);
          }
        }catch(err){
          console.error(`${pair.sub}: ERROR inserting '${s.name}' for parent '${parent.name}' - ${err.message}`);
          try{ await pool.query('ROLLBACK'); }catch(_){}
        }
      }
    }
  }catch(err){
    if(/does not exist/.test(err.message)) console.log(`${pair.category}: table not found, skipping`);
    else console.error(`${pair.category}: ERROR - ${err.message}`);
  }
}

async function main(){
  console.log(dry? 'Dry-run: no DB changes' : 'Applying inserts');
  for(const p of tablePairs) await ensureForPair(p);
  console.log('Done');
  process.exit(0);
}

main().catch(e=>{ console.error(e); process.exit(1); });
