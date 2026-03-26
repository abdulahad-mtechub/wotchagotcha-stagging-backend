import pool from "../db.config/index.js";

async function run() {
  const emojiValue = "😀";

  const before = await pool.query("SELECT id, image, description FROM gebc WHERE id = 74");
  const updated = await pool.query(
    "UPDATE gebc SET image = $1, updated_at = NOW() WHERE id = 74 RETURNING id, image, description",
    [emojiValue]
  );

  console.log(
    JSON.stringify(
      {
        before: before.rows,
        updated: updated.rows,
        updatedCount: updated.rowCount,
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
