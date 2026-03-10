import pool from './db.config/index.js';

async function queryData() {
  try {
    const categories = await pool.query("SELECT * FROM item_category;");
    console.log("Categories:", JSON.stringify(categories.rows, null, 2));

    const users = await pool.query("SELECT id, username FROM users WHERE is_deleted=FALSE LIMIT 5;");
    console.log("Users:", JSON.stringify(users.rows, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

queryData();
