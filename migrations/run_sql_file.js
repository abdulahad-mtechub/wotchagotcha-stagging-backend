import fs from 'fs';
import pool from '../db.config/index.js';

async function run() {
  try {
    const file = process.argv[2];
    if (!file) {
      console.error('Usage: node run_sql_file.js <sql-file-path>');
      process.exit(1);
    }
    const sql = fs.readFileSync(file).toString();
    console.log('Running SQL file:', file);
    await pool.query(sql);
    console.log('SQL applied successfully');
    process.exit(0);
  } catch (err) {
    console.error('SQL execution failed:', err);
    process.exit(1);
  }
}

run();
