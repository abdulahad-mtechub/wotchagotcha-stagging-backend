import pool from "../db.config/index.js";

const CANDIDATE_TABLES = [
  "app_category",
  "video_category",
  "pic_category",
  "disc_category",
  "news_category",
  "gebc_category",
  "qafi_category",
];

async function run() {
  const out = {};
  for (const t of CANDIDATE_TABLES) {
    try {
      const r = await pool.query(
        `SELECT * FROM ${t} WHERE CAST(name AS TEXT) ILIKE '%ebic%' OR CAST(name AS TEXT) ILIKE '%gebc%' OR CAST(french_name AS TEXT) ILIKE '%ebic%'`
      );
      out[t] = r.rows;
    } catch (e) {
      out[t] = { error: e.message };
    }
  }

  const topTables = {};
  for (const t of ["top_GEBC", "top_NEWS", "top_QAFI", "top_tours", "top_video"]) {
    try {
      const r = await pool.query(`SELECT * FROM ${t} ORDER BY id DESC LIMIT 10`);
      topTables[t] = r.rows;
    } catch (e) {
      topTables[t] = { error: e.message };
    }
  }

  console.log(JSON.stringify({ categories: out, topTables }, null, 2));
  await pool.end();
}

run().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
