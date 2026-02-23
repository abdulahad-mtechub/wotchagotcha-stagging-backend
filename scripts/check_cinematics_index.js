import pool from '../db.config/index.js';

async function check() {
  const query = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'cinematics_sub_category' AND column_name = 'index'
  `;
  try {
    const res = await pool.query(query);
    console.log('cinematics_sub_category.index exists:', res.rowCount > 0);
  } catch (err) {
    console.error('Error checking column:', err.message || err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

check();
