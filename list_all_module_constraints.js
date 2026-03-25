
import pool from "./db.config/index.js";

async function listAllConstraints() {
    const tables = [
        'xpi_videos', 'pic_tours', 'news', 'sports', 'tv_progmax_videos', 'QAFI',
        'learning_hobbies_videos', 'kid_vids_videos', 'fan_star_videos',
        'cinematic_videos', 'gebc', 'item'
    ];

    const query = `
    SELECT
        tc.table_name,
        kcu.column_name,
        tc.constraint_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = ANY($1);
  `;

    try {
        const res = await pool.query(query, [tables]);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

listAllConstraints();
