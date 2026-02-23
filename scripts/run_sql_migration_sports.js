import fs from 'fs';
import pool from '../db.config/index.js';

async function run() {
  try {
    const sql = fs.readFileSync('scripts/add_sports_subcategory_index.sql', 'utf8');
    console.log('Executing sports migration SQL script...');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('sports migration executed successfully.');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error executing sports migration SQL script:', err.stack || err.message || err);
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
