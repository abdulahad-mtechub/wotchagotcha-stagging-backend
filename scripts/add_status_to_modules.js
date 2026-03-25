import pool from '../db.config/index.js';

async function migrate() {
    const tables = [
        'xpi_videos',
        'pic_tours',
        'NEWS',
        'post_letters',
        'tv_progmax_videos',
        'QAFI',
        'learning_hobbies_videos',
        'kid_vids_videos',
        'fan_star_videos',
        'cinematics_videos',
        'GEBC',
        'item',
        'sports'
    ];

    try {
        console.log('Starting migration to add status column...');
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const table of tables) {
                console.log(`Adding status column to ${table}...`);
                // Use standard approach: add column if not exists
                await client.query(`
          DO $$ 
          BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='${table}' AND column_name='status') THEN
              ALTER TABLE ${table} ADD COLUMN status VARCHAR(50) DEFAULT 'active';
            END IF;
          END $$;
        `);
            }

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
