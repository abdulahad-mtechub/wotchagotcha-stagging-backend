import pool from './db.config/index.js';

async function checkRecord2014() {
    const ids = [2014, 1638];
    console.log(`Checking records: ${ids.join(', ')}`);

    try {
        const query = `
      SELECT v.id, v.user_id, v.video_category, v.sub_category, v.status, v.shared_post_id, u.username, u.is_deleted, u.id as u_id
      FROM xpi_videos v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.id = ANY($1::int[])
    `;
        const result = await pool.query(query, [ids]);

        if (result.rows.length === 0) {
            console.log("No records found with these IDs.");
        } else {
            result.rows.forEach(row => console.log(JSON.stringify(row, null, 2)));
        }

    } catch (error) {
        console.error("Error checking records:", error);
    } finally {
        process.exit();
    }
}

checkRecord2014();
