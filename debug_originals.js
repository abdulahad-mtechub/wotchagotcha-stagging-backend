import pool from './db.config/index.js';

async function checkOriginals() {
    const origIds = [524, 1811, 1819];
    console.log(`Checking original posts: ${origIds.join(', ')}`);

    try {
        const query = `
      SELECT id, video_category, sub_category
      FROM xpi_videos
      WHERE id = ANY($1::int[])
    `;
        const result = await pool.query(query, [origIds]);

        console.table(result.rows);

        // Also check if category 38 exists
        const catCheck = await pool.query("SELECT * FROM video_category WHERE id = 38");
        console.log("Category 38 details:", catCheck.rows);

    } catch (error) {
        console.error("Error checking originals:", error);
    } finally {
        process.exit();
    }
}

checkOriginals();
