import pool from "../db.config/index.js";

// Inserts 10 unique records per kid_vids subcategory into `kid_vids_videos`
// Usage: `node scripts/create_kidvids_seed.js`

const SAMPLES = [
  { video: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', thumb: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg' },
  { video: 'https://www.w3schools.com/html/mov_bbb.mp4', thumb: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg' },
  { video: 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4', thumb: 'https://picsum.photos/640/360' },
  { video: 'https://file-examples-com.github.io/uploads/2017/04/file_example_MP4_480_1_5MG.mp4', thumb: 'https://picsum.photos/640/360?random=2' },
  { video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', thumb: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg' },
  { video: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', thumb: 'https://sample-videos.com/img/Sample-jpg-image-500kb.jpg' }
];

const POSTS_PER_SUBCATEGORY = 10;

function uniqueText(base, idx) {
  return `${base} - ${idx} - ${Date.now()}`;
}

async function main() {
  const client = await pool.connect();
  try {
    // find an active user to assign
    const u = await client.query('SELECT id FROM users WHERE is_deleted=FALSE LIMIT 1');
    if (u.rowCount === 0) {
      console.error('No user found in `users` table to assign as user_id. Aborting.');
      process.exit(1);
    }
    const userId = u.rows[0].id;

    const cats = await client.query('SELECT id,name FROM kid_vids_category ORDER BY id');
    if (cats.rowCount === 0) {
      console.error('No rows in kid_vids_category. Aborting.');
      process.exit(1);
    }

    await client.query('BEGIN');

    for (const cat of cats.rows) {
      const subsRes = await client.query('SELECT id,name FROM kid_vids_sub_category WHERE category_id=$1 ORDER BY id', [cat.id]);
      let subs = subsRes.rows;
      if (subs.length === 0) {
        const anySub = await client.query('SELECT id,name FROM kid_vids_sub_category LIMIT 1');
        if (anySub.rowCount === 0) {
          console.error('No kid_vids_sub_category rows found at all. Aborting.');
          await client.query('ROLLBACK');
          process.exit(1);
        }
        subs = [anySub.rows[0]];
      }

      console.log(`Inserting ${POSTS_PER_SUBCATEGORY} items for kid_vids_category id=${cat.id} (${cat.name})`);

      for (const sub of subs) {
        for (let i = 1; i <= POSTS_PER_SUBCATEGORY; i++) {
          const sample = SAMPLES[(i - 1) % SAMPLES.length];
          const name = uniqueText(`${cat.name} / ${sub.name} Kids Clip`, i);
          const description = uniqueText(`Auto-inserted kid vid for ${cat.name} - ${sub.name}`, i);
          const insertQ = `INSERT INTO kid_vids_videos (user_id, name, description, category_id, sub_category_id, video, thumbnail) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
          const vals = [userId, name, description, cat.id, sub.id, sample.video, sample.thumb];
          const r = await client.query(insertQ, vals);
          console.log(`  -> inserted id=${r.rows[0].id} category=${cat.id} sub_category=${sub.id}`);
        }
      }
    }

    await client.query('COMMIT');
    console.log('All inserts committed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error during insertion:', err.message || err);
    try { await client.query('ROLLBACK'); } catch (e) {}
    process.exit(1);
  } finally {
    client.release();
  }
}

main();
