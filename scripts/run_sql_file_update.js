import fs from 'fs';
import pool from '../db.config/index.js';

async function run(filePath){
  try{
    const sql = fs.readFileSync(filePath,'utf8');
    console.log('Executing', filePath);
    const client = await pool.connect();
    try{
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('Executed successfully.');
    }catch(err){
      await client.query('ROLLBACK');
      console.error('Execution error:', err.stack||err.message||err);
      process.exitCode = 1;
    }finally{
      client.release();
      await pool.end();
    }
  }catch(err){
    console.error('Read/exec failed:', err.stack||err.message||err);
    process.exitCode = 1;
  }
}

const f = process.argv[2] || 'scripts/update_gebc_emoji_urls.sql';
run(f);
