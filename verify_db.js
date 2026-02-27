
import pool from "./db.config/index.js";

const tables = [
    'xpi_videos', 'news', 'qafi', 'gebc', 'pic_tours',
    'cinematics_videos', 'fan_star_videos', 'tv_progmax_videos',
    'kid_vids_videos', 'learning_hobbies_videos', 'sports', 'item'
];

async function verify() {
    console.log("Starting verification...");
    for (const table of tables) {
        try {
            const res = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1 AND column_name = 'shared_post_id'
            `, [table]);

            if (res.rowCount > 0) {
                console.log(`[OK] ${table} has shared_post_id`);
            } else {
                console.log(`[MISSING] ${table} DOES NOT have shared_post_id. Attempting to add...`);
                await pool.query(`ALTER TABLE public.${table} ADD COLUMN shared_post_id INT REFERENCES public.${table}(id) ON DELETE SET NULL`);
                console.log(`[FIXED] Added shared_post_id to ${table}`);
            }
        } catch (e) {
            console.error(`[ERROR] Failed to verify/fix ${table}:`, e.message);
        }
    }
    process.exit(0);
}

verify();
