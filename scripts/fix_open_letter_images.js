/**
 * Fix post_letters_images for public (open) letters so UI can load images:
 * - Replace empty / Cloudinary / invalid URLs with stable picsum URLs (seeded by id)
 * - Insert one placeholder image for public letters that have no image rows and no video
 */
import pool from "../db.config/index.js";

async function run() {
  const fixBroken = await pool.query(`
    UPDATE post_letters_images pli
    SET image = 'https://picsum.photos/seed/olimg-' || pli.id::text || '/640/360'
    FROM post_letters pl
    WHERE pli.letter_id = pl.id
      AND pl.post_type = 'public'
      AND (
        pli.image IS NULL
        OR btrim(pli.image) = ''
        OR pli.image ILIKE '%res.cloudinary.com%'
      )
    RETURNING pli.id
  `);

  const insertMissing = await pool.query(`
    INSERT INTO post_letters_images (letter_id, image)
    SELECT pl.id,
      'https://picsum.photos/seed/olletter-' || pl.id::text || '/640/360'
    FROM post_letters pl
    WHERE pl.post_type = 'public'
      AND NOT EXISTS (SELECT 1 FROM post_letters_images i WHERE i.letter_id = pl.id)
      AND (pl.video IS NULL OR btrim(pl.video::text) = '')
    RETURNING id, letter_id
  `);

  console.log(
    JSON.stringify(
      {
        updatedImageRows: fixBroken.rowCount,
        insertedImageRows: insertMissing.rowCount,
      },
      null,
      2
    )
  );

  await pool.end();
}

run().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
