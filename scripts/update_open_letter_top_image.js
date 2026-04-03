/**
 * Set a displayable image for the featured top letter (same as getTopLetterApp).
 * Prefers post_type = 'public' (open letter); else any top_letter row.
 */
import pool from "../db.config/index.js";

const imageUrlForLetterId = (id) =>
  `https://picsum.photos/seed/top-open-letter-${id}/800/450`;

async function run() {
  let top = await pool.query(
    `SELECT pl.id, pl.post_type
     FROM post_letters pl
     JOIN users u ON pl.user_id = u.id
     WHERE pl.top_letter = TRUE
       AND pl.post_type = 'public'
       AND u.is_deleted = FALSE
     ORDER BY pl.top_added_date DESC NULLS LAST, pl.id DESC
     LIMIT 1`
  );

  if (top.rowCount === 0) {
    top = await pool.query(
      `SELECT pl.id, pl.post_type
       FROM post_letters pl
       JOIN users u ON pl.user_id = u.id
       WHERE pl.top_letter = TRUE AND u.is_deleted = FALSE
       ORDER BY pl.top_added_date DESC NULLS LAST, pl.id DESC
       LIMIT 1`
    );
  }

  if (top.rowCount === 0) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          message:
            "No letter with top_letter=true; set a top letter in admin/top first",
        },
        null,
        2
      )
    );
    await pool.end();
    return;
  }

  const letterId = top.rows[0].id;
  const postType = top.rows[0].post_type;
  const url = imageUrlForLetterId(letterId);

  const firstImg = await pool.query(
    `SELECT id FROM post_letters_images WHERE letter_id = $1 ORDER BY id ASC LIMIT 1`,
    [letterId]
  );

  let action;
  if (firstImg.rowCount > 0) {
    await pool.query(`UPDATE post_letters_images SET image = $1 WHERE id = $2`, [
      url,
      firstImg.rows[0].id,
    ]);
    action = "updated";
  } else {
    await pool.query(
      `INSERT INTO post_letters_images (letter_id, image) VALUES ($1, $2)`,
      [letterId, url]
    );
    action = "inserted";
  }

  console.log(
    JSON.stringify(
      { ok: true, letterId, post_type: postType, action, image: url },
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
