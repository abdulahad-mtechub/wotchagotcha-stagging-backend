
import pool from "./db.config/index.js";

async function check() {
    try {
        const tables = [
            'pic_tours',
            'qafi',
            'gebc',
            'news',
            'cinematics_videos',
            'fan_star_videos',
            'tv_progmax_videos',
            'kid_vids_videos',
            'learning_hobbies_videos',
            'sports',
            'item'
        ];

        for (const table of tables) {
            const res = await pool.query(`
                SELECT
                    '${table}' as table_name,
                    conname,
                    pg_get_constraintdef(c.oid)
                FROM
                    pg_constraint c
                JOIN
                    pg_namespace n ON n.oid = c.connamespace
                WHERE
                    contype = 'f' AND
                    conrelid = 'public.${table}'::regclass;
            `);
            console.log(`Constraints for ${table}:`, res.rows);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
