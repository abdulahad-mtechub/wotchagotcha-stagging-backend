import pool from '../db.config/index.js';

const IMAGES = [
  'https://picsum.photos/900/500?random=11',
  'https://picsum.photos/900/500?random=12',
  'https://picsum.photos/900/500?random=13',
  'https://picsum.photos/900/500?random=14',
  'https://picsum.photos/900/500?random=15',
  'https://picsum.photos/900/500?random=16',
  'https://picsum.photos/900/500?random=17',
  'https://picsum.photos/900/500?random=18'
];

async function main(){
  const client = await pool.connect();
  try{
    const cats = await client.query('SELECT id,name FROM pic_category ORDER BY id');
    if(cats.rowCount===0){
      console.error('No pic_category rows found. Aborting.');
      process.exit(1);
    }

    await client.query('BEGIN');
    let imgIdx = 0;
    for(const cat of cats.rows){
      console.log(`Inserting 6 top_tours for pic_category id=${cat.id} (${cat.name})`);
      for(let i=0;i<6;i++){
        const image = IMAGES[imgIdx % IMAGES.length];
        const name = `${cat.name} Spotlight ${i+1}`;
        const description = `Featured ${cat.name} item number ${i+1}.`;
        const q = `INSERT INTO top_tours (name, description, pic_category, image) VALUES($1,$2,$3,$4) RETURNING id`;
        const r = await client.query(q, [name, description, cat.id, image]);
        console.log(`  -> inserted top_tours id=${r.rows[0].id}`);
        imgIdx++;
      }
    }
    await client.query('COMMIT');
    console.log('Inserted top_tours successfully.');
    process.exit(0);
  }catch(err){
    console.error('Error inserting top_tours:', err.message || err);
    try{ await client.query('ROLLBACK'); }catch(e){}
    process.exit(1);
  }finally{
    client.release();
  }
}

main();
