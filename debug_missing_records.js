import pool from './db.config/index.js';

async function checkRecords() {
    const ids = [2001, 2002, 2003, 2004, 2006];
    console.log(`Checking records: ${ids.join(', ')}`);

    try {
        const query = `
      SELECT v.*, u.username, u.is_deleted
      FROM xpi_videos v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.id = ANY($1::int[])
    `;
        const result = await pool.query(query, [ids]);

        if (result.rows.length === 0) {
            console.log("No records found with these IDs.");
        } else {
            console.table(result.rows);
        }

        // Also check how many videos have category 38
        const catQuery = `SELECT COUNT(*) FROM xpi_videos WHERE video_category = 38`;
        const catResult = await pool.query(catQuery);
        console.log(`Total videos with category 38: ${catResult.rows[0].count}`);

    } catch (error) {
        console.error("Error checking records:", error);
    } finally {
        process.exit();
    }
}

checkRecords();
