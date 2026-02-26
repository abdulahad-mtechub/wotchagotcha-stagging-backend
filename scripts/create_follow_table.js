import pool from '../db.config/index.js';

async function createFollowTable() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log("Creating 'follow' table...");

        const query = `
            CREATE TABLE IF NOT EXISTS public.follow (
                id SERIAL PRIMARY KEY,
                follower_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
                following_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
            );
        `;

        await client.query(query);

        await client.query('COMMIT');
        console.log("Successfully created 'follow' table.");
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error creating 'follow' table:", error);
    } finally {
        client.release();
    }
}

createFollowTable().then(() => process.exit());
