import pool from "../db.config/index.js";

const IMAGE_URL = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f389.png";
const DEFAULT_DESC = "EBIC top record";

async function run() {
  const disc = await pool.query(
    `SELECT id, name, french_name
     FROM disc_category
     WHERE LOWER(TRIM(name)) IN ('ebic','gebc')
        OR LOWER(TRIM(COALESCE(french_name,''))) IN ('ebic','gebc')
     ORDER BY id`
  );

  if (!disc.rows.length) {
    console.log(JSON.stringify({ ok: false, message: "No EBIC/GEBC entry found in disc_category" }, null, 2));
    await pool.end();
    return;
  }

  const categoryId = disc.rows[0].id;
  const existing = await pool.query(
    `SELECT id, disc_category, image, description FROM top_GEBC WHERE disc_category = $1 ORDER BY id DESC LIMIT 1`,
    [categoryId]
  );

  let result;
  if (existing.rows.length) {
    result = await pool.query(
      `UPDATE top_GEBC SET image = $1, updated_at = NOW() WHERE id = $2 RETURNING id, disc_category, image, description`,
      [IMAGE_URL, existing.rows[0].id]
    );
  } else {
    result = await pool.query(
      `INSERT INTO top_GEBC (description, disc_category, image) VALUES ($1, $2, $3) RETURNING id, disc_category, image, description`,
      [DEFAULT_DESC, categoryId, IMAGE_URL]
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        discCategory: disc.rows[0],
        action: existing.rows.length ? "updated" : "inserted",
        record: result.rows[0],
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
