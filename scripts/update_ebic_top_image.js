import pool from "../db.config/index.js";

const IMAGE_URL = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f389.png";

async function run() {
  // Discover EBIC category id from gebc_category by name
  const cat = await pool.query(
    `SELECT id, name FROM gebc_category WHERE LOWER(TRIM(name)) IN ('ebic','gebc') ORDER BY id`
  );

  if (!cat.rows.length) {
    console.log(JSON.stringify({ ok: false, message: "No EBIC category found in gebc_category" }, null, 2));
    await pool.end();
    return;
  }

  const ebicIds = cat.rows.map((r) => r.id);
  const before = await pool.query(
    `SELECT id, disc_category, image, description FROM top_GEBC WHERE disc_category = ANY($1::int[]) ORDER BY id`,
    [ebicIds]
  );

  const upd = await pool.query(
    `UPDATE top_GEBC SET image = $1 WHERE disc_category = ANY($2::int[]) RETURNING id, disc_category, image`,
    [IMAGE_URL, ebicIds]
  );

  const after = await pool.query(
    `SELECT id, disc_category, image, description FROM top_GEBC WHERE disc_category = ANY($1::int[]) ORDER BY id`,
    [ebicIds]
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        categoryMatches: cat.rows,
        updatedCount: upd.rowCount,
        before: before.rows,
        after: after.rows,
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
