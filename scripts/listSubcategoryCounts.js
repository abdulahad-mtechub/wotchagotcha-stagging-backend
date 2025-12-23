import pool from '../db.config/index.js';

const subTables = [
  'disc_sub_category','video_sub_category','pic_sub_category',
  'QAFI_sub_category','GEBC_sub_category','NEWS_sub_category',
  'cinematics_sub_category','fan_star_sub_category','tv_progmax_sub_category',
  'kid_vids_sub_category','learning_hobbies_sub_category','sport_sub_category'
];

async function main(){
  console.log('Counting rows in subcategory tables:');
  for(const t of subTables){
    try{
      const res = await pool.query(`SELECT count(*) AS c FROM ${t}`);
      console.log(`${t}: ${res.rows[0].c}`);
    }catch(err){
      if (/does not exist/.test(err.message)) console.log(`${t}: (table not found)`);
      else console.error(`${t}: ERROR - ${err.message}`);
    }
  }
  process.exit(0);
}

main().catch(e=>{ console.error(e); process.exit(1); });
