import fs from 'fs';
import pool from '../db.config/index.js';

async function run() {
  try {
    const sql = fs.readFileSync('scripts/create_reported_user_table.sql', 'utf8');
    console.log('Executing reported_user migration SQL script...');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('reported_user migration executed successfully.');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error executing reported_user migration SQL script:', err.stack || err.message || err);
      process.exitCode = 1;
    } finally {
      client.release();
      await pool.end();
    }
  } catch (err) {
    console.error('Failed to read/execute SQL file:', err.stack || err.message || err);
    process.exitCode = 1;
  }
}

run();
