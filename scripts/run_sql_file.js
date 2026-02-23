import fs from 'fs';
import pool from '../db.config/index.js';

async function run() {
  try {
    const sql = fs.readFileSync('scripts/seed_gebc_emtao.sql', 'utf8');
    console.log('Executing SQL script...');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('SQL script executed successfully.');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error executing SQL script:', err.stack || err.message || err);
      process.exitCode = 1;
    } finally {
      client.release();
      // allow pool to drain
      await pool.end();
    }
  } catch (err) {
    console.error('Failed to read/execute SQL file:', err.stack || err.message || err);
    process.exitCode = 1;
  }
}

run();
