import pool from '../db.config/index.js';
import fs from 'fs';

const replacements = JSON.parse(fs.readFileSync(new URL('../data/subs_replacements.json', import.meta.url)));
const argv = process.argv.slice(2);
const dry = argv.includes('--dry-run');

const pairs = [
  {cat:'video_category', sub:'video_sub_category'},
  {cat:'pic_category', sub:'pic_sub_category'},
  {cat:'NEWS_category', sub:'NEWS_sub_category'},
  {cat:'cinematics_category', sub:'cinematics_sub_category'},
  {cat:'fan_star_category', sub:'fan_star_sub_category'},
  {cat:'tv_progmax_category', sub:'tv_progmax_sub_category'},
  {cat:'kid_vids_category', sub:'kid_vids_sub_category'},
  {cat:'learning_hobbies_category', sub:'learning_hobbies_sub_category'},
  {cat:'sports_category', sub:'sport_sub_category'}
];

const GENERIC_NAMES = new Set(['General','Popular','Général','Populaire','General ','Popular ']);

async function processPair(p){
  try{
    const parents = await pool.query(`SELECT id,name FROM ${p.cat}`);
    for(const parent of parents.rows){
      // find generic subs for this parent
      let subs;
      try{
        const res = await pool.query(`SELECT id,name,french_name FROM ${p.sub} WHERE category_id=$1 ORDER BY id`, [parent.id]);
        subs = res.rows;
      }catch(err){
        if(/does not exist/.test(err.message)) { console.log(`${p.sub}: table not found`); return; }
        throw err;
      }

      const genericRows = subs.filter(s => GENERIC_NAMES.has(s.name) || GENERIC_NAMES.has(s.french_name));
      if(genericRows.length===0) continue;

      // choose replacement list
      const tableMap = replacements[p.cat] || {};
      const mapped = tableMap[parent.name] || tableMap['default'] || [];
      if(mapped.length===0) {
        console.log(`${p.cat} -> ${parent.name}: no replacement mapping found, skipping`);
        continue;
      }

      for(let i=0;i<genericRows.length;i++){
        const row = genericRows[i];
        const rep = mapped[i] || mapped[0];
        if(dry){
          console.log(`WOULD UPDATE: ${p.sub} id=${row.id} (${row.name}) -> name='${rep.name}', french_name='${rep.french_name}'`);
        }else{
          await pool.query('BEGIN');
          await pool.query(`UPDATE ${p.sub} SET name=$1, french_name=$2, updated_at=NOW() WHERE id=$3`, [rep.name, rep.french_name, row.id]);
          await pool.query('COMMIT');
          console.log(`UPDATED: ${p.sub} id=${row.id} -> ${rep.name}`);
        }
      }
    }
  }catch(err){
    console.error(`${p.cat}: ERROR - ${err.message}`);
  }
}

async function main(){
  console.log(dry? 'Dry-run: no DB changes' : 'Applying replacements');
  for(const p of pairs) await processPair(p);
  console.log('Done');
  process.exit(0);
}

main().catch(e=>{ console.error(e); process.exit(1); });
