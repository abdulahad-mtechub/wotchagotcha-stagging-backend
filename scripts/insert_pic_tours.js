import pool from '../db.config/index.js';

// Public image URLs to use as `image` values
const IMAGES = [
  'https://picsum.photos/800/500?random=1',
  'https://picsum.photos/800/500?random=2',
  'https://picsum.photos/800/500?random=3',
  'https://picsum.photos/800/500?random=4',
  'https://picsum.photos/800/500?random=5',
  'https://picsum.photos/800/500?random=6',
  'https://picsum.photos/800/500?random=7',
  'https://picsum.photos/800/500?random=8',
  'https://picsum.photos/800/500?random=9',
  'https://picsum.photos/800/500?random=10'
];

async function main(){
  const client = await pool.connect();
  try{
    const u = await client.query("SELECT id FROM users WHERE is_deleted=FALSE LIMIT 1");
    if(u.rowCount===0){
      console.error('No active users found. Aborting.');
      process.exit(1);
    }
    const userId = u.rows[0].id;

    const cats = await client.query('SELECT id,name FROM pic_category ORDER BY id');
    if(cats.rowCount===0){
      console.error('No pic_category rows found. Aborting.');
      process.exit(1);
    }

    await client.query('BEGIN');
    let imgIdx = 0;
    for(const cat of cats.rows){
      const subsRes = await client.query('SELECT id,name FROM pic_sub_category WHERE category_id=$1 ORDER BY id', [cat.id]);
      let subs = subsRes.rows;
      if(subs.length===0){
        const any = await client.query('SELECT id,name FROM pic_sub_category LIMIT 1');
        if(any.rowCount===0){
          console.error('No pic_sub_category rows at all. Aborting.');
          await client.query('ROLLBACK');
          process.exit(1);
        }
        subs = any.rows;
      }

      console.log(`Inserting 6 pic_tours for pic_category id=${cat.id} (${cat.name})`);
      for(let i=0;i<6;i++){
        const sub = subs[i % subs.length];
        const image = IMAGES[imgIdx % IMAGES.length];
        const name = `${cat.name} — ${sub.name} Photo ${i+1}`;
        const description = `A curated ${sub.name.toLowerCase()} gallery from ${cat.name}. Photo #${i+1}`;

        const insertQ = `INSERT INTO pic_tours (name, description, pic_category, sub_category, image, user_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`;
        const vals = [name, description, cat.id, sub.id, image, userId];
        const r = await client.query(insertQ, vals);
        console.log(`  -> inserted id=${r.rows[0].id} sub=${sub.id}`);
        imgIdx++;
      }
    }

    await client.query('COMMIT');
    console.log('Inserted pic_tours successfully.');
    process.exit(0);
  }catch(err){
    console.error('Error inserting pic_tours:', err.message || err);
    try{ await client.query('ROLLBACK'); }catch(e){}
    process.exit(1);
  }finally{
    client.release();
  }
}

main();
