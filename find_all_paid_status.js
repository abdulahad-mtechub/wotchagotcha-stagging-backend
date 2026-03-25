import pool from "./db.config/index.js";

async function findAllPaidStatus() {
    try {
        const res = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE column_name = 'paid_status'
      AND table_schema = 'public'
    `);
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findAllPaidStatus();
