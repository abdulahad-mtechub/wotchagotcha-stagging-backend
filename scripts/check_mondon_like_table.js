import pool from "../db.config/index.js";

async function run() {
  const r = await pool.query(
    "SELECT to_regclass('public.mondon_market_like') AS table_name"
  );
  console.log(JSON.stringify(r.rows[0], null, 2));
  await pool.end();
}

run().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
