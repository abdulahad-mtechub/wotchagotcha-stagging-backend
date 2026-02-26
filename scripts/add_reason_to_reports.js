import pool from '../db.config/index.js';

async function addReasonColumn() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log("Adding 'reason' column to 'item_report' table...");

        // Check if column exists first to avoid error
        const checkColumn = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='item_report' AND column_name='reason'
        `;
        const { rows } = await client.query(checkColumn);

        if (rows.length === 0) {
            await client.query("ALTER TABLE item_report ADD COLUMN reason TEXT NOT NULL DEFAULT 'No reason provided'");
            // Remove default after adding so future inserts must provide it
            await client.query("ALTER TABLE item_report ALTER COLUMN reason DROP DEFAULT");
            console.log("Successfully added 'reason' column.");
        } else {
            console.log("'reason' column already exists.");
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error adding 'reason' column:", error);
    } finally {
        client.release();
    }
}

addReasonColumn().then(() => process.exit());
