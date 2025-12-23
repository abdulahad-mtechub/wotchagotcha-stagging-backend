import pool from '../db.config/index.js';

const VIDEOS = [
  {video:'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', thumb:'https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg'},
  {video:'https://www.w3schools.com/html/mov_bbb.mp4', thumb:'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg'},
  {video:'https://samplelib.com/lib/preview/mp4/sample-10s.mp4', thumb:'https://picsum.photos/640/360'},
  {video:'https://file-examples-com.github.io/uploads/2017/04/file_example_MP4_480_1_5MG.mp4', thumb:'https://picsum.photos/640/360?random=2'},
  {video:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', thumb:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg'},
  {video:'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', thumb:'https://sample-videos.com/img/Sample-jpg-image-500kb.jpg'}
];

async function main(){
  const client = await pool.connect();
  try{
    // Find a valid user id
    const u = await client.query("SELECT id FROM users WHERE is_deleted=FALSE LIMIT 1");
    if(u.rowCount===0){
      console.error('No user found in `users` table to assign as user_id. Aborting.');
      process.exit(1);
    }
    const userId = u.rows[0].id;

    const cats = await client.query('SELECT id,name FROM video_category ORDER BY id');
    if(cats.rowCount===0){
      console.error('No rows in video_category. Aborting.');
      process.exit(1);
    }

    await client.query('BEGIN');
    let globalIdx = 0;
    for(const cat of cats.rows){
      // get subcategories for this category
      const subsRes = await client.query('SELECT id FROM video_sub_category WHERE category_id=$1 ORDER BY id', [cat.id]);
      let subs = subsRes.rows.map(r=>r.id);
      if(subs.length===0){
        // fallback: any subcategory
        const anySub = await client.query('SELECT id FROM video_sub_category LIMIT 1');
        if(anySub.rowCount===0){
          console.error('No video_sub_category rows found at all. Aborting.');
          await client.query('ROLLBACK');
          process.exit(1);
        }
        subs = [anySub.rows[0].id];
      }

      console.log(`Inserting 3 samples for video_category id=${cat.id} (${cat.name}) using user_id=${userId}`);
      for(let i=0;i<3;i++){
        const vid = VIDEOS[globalIdx % VIDEOS.length];
        const subId = subs[i % subs.length];
        const name = `${cat.name} Sample ${i+1}`;
        const desc = `Auto-inserted sample for category ${cat.name}`;
        const insertQ = `INSERT INTO xpi_videos (name, description, video_category, sub_category, video, user_id, thumbnail) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
        const vals = [name, desc, cat.id, subId, vid.video, userId, vid.thumb];
        const r = await client.query(insertQ, vals);
        console.log(`  -> inserted id=${r.rows[0].id} sub_category=${subId}`);
        globalIdx++;
      }
    }
    await client.query('COMMIT');
    console.log('All inserts committed successfully.');
    process.exit(0);
  }catch(err){
    console.error('Error during insertion:', err.message || err);
    try{ await client.query('ROLLBACK'); }catch(e){}
    process.exit(1);
  }finally{
    client.release();
  }
}

main();
