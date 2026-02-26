import pool from '../db.config/index.js';

async function fixStatusCase() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log("Standardizing item_report status to lowercase 'pending'...");

        // 1. Update existing records
        await client.query("UPDATE item_report SET status = 'pending' WHERE status = 'Pending'");

        // 2. Drop the old constraint
        await client.query("ALTER TABLE item_report DROP CONSTRAINT IF EXISTS item_report_status_check");

        // 3. Add the new constraint with correct casing
        await client.query("ALTER TABLE item_report ADD CONSTRAINT item_report_status_check CHECK (status IN ('pending', 'blocked', 'rejected'))");

        // 4. Update default value
        await client.query("ALTER TABLE item_report ALTER COLUMN status SET DEFAULT 'pending'");

        await client.query('COMMIT');
        console.log("Successfully standardized status to 'pending'.");
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error standardizing status:", error);
    } finally {
        client.release();
    }
}

fixStatusCase().then(() => process.exit());
