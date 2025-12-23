import pool from '../db.config/index.js';

async function main(){
  const client = await pool.connect();
  try{
    const rows = await client.query(`
      SELECT v.id, v.video, v.thumbnail, v.user_id, v.created_at,
             v.video_category, vc.name AS category_name,
             v.sub_category, vsc.name AS sub_category_name
      FROM xpi_videos v
      LEFT JOIN video_category vc ON v.video_category = vc.id
      LEFT JOIN video_sub_category vsc ON v.sub_category = vsc.id
      ORDER BY v.id
    `);

    if(rows.rowCount===0){
      console.log('No xpi_videos rows found.');
      process.exit(0);
    }

    await client.query('BEGIN');
    let count = 0;
    for(const r of rows.rows){
      const cat = r.category_name || `Category${r.video_category}`;
      const sub = r.sub_category_name || `Sub${r.sub_category}`;
      const newName = `${cat} — ${sub} (Clip #${r.id})`;
      const newDesc = `Watch this ${sub} from ${cat}. Source: ${r.video.split('/').slice(-1)[0]}`;

      await client.query('UPDATE xpi_videos SET name=$1, description=$2, updated_at=NOW() WHERE id=$3', [newName, newDesc, r.id]);
      count++;
    }

    await client.query('COMMIT');
    console.log(`Updated ${count} xpi_videos rows with personalized name/description.`);
    process.exit(0);
  }catch(err){
    console.error('Error:', err.message || err);
    try{ await client.query('ROLLBACK'); }catch(e){}
    process.exit(1);
  }finally{
    client.release();
  }
}

main();
