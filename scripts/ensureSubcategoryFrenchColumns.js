import pool from '../db.config/index.js';

const subTables = [
  'video_sub_category','pic_sub_category','news_sub_category',
  'tv_progmax_sub_category','kid_vids_sub_category','learning_hobbies_sub_category','sports_sub_category'
];

async function main(){
  console.log('Ensuring `french_name` column exists on subcategory tables...');
  for(const t of subTables){
    try{
      await pool.query(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS french_name VARCHAR(255)`);
      console.log(`${t}: ensured french_name column`);
    }catch(err){
      if (/does not exist/.test(err.message)) console.log(`${t}: table not found, skipping`);
      else console.error(`${t}: ERROR - ${err.message}`);
    }
  }
  console.log('Done');
  process.exit(0);
}

main().catch(e=>{ console.error(e); process.exit(1); });
