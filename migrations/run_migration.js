import fs from 'fs';
import pool from '../db.config/index.js';

async function run() {
  try {
    const sql = fs.readFileSync('migrations/add_banner_category_columns.sql').toString();
    await pool.query(sql);
    console.log('Migration applied successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
