import pool from '../db.config/index.js';

async function migrate() {
    try {
        console.log('Starting migration for item_report status constraint...');
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Update existing records to 'Pending' if they are 'pending' to match NEW default (optional but good for consistency)
            // await client.query("UPDATE item_report SET status = 'Pending' WHERE status = 'pending'");

            // Drop and recreate constraint
            await client.query('ALTER TABLE item_report DROP CONSTRAINT IF EXISTS item_report_status_check');
            await client.query("ALTER TABLE item_report ADD CONSTRAINT item_report_status_check CHECK (status IN ('Pending', 'blocked', 'rejected', 'pending'))");
            await client.query("ALTER TABLE item_report ALTER COLUMN status SET DEFAULT 'Pending'");

            await client.query('COMMIT');
            console.log('Migration completed successfully!');
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Migration failed:', err.message);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Connection failed:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();
