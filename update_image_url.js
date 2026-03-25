import pool from './db.config/index.js';

async function updateImage() {
  console.log("Starting image update...");
  try {
    const fullUrl = 'http://192.168.18.136:3801/itemImages/premium_guitar.png';
    const query = "UPDATE item_images SET image = $1 WHERE item_id = 1867";
    console.log(`Updating item_id 1867 with URL: ${fullUrl}`);
    const result = await pool.query(query, [fullUrl]);
    console.log('Update result rowCount:', result.rowCount);
    console.log('Image URL updated successfully!');
    process.exit(0);
  } catch (err) {
    console.error("ERROR:");
    console.error(err);
    process.exit(1);
  }
}

updateImage();
