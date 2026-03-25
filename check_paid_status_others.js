import pool from "./db.config/index.js";

async function checkOtherTables() {
    try {
        const res = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('news', 'qafi', 'gebc', 'xpi_videos', 'pic_tours') 
      AND column_name = 'paid_status'
    `);
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkOtherTables();
