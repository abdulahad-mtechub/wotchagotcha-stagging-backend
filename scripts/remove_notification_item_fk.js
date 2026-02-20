import pool from '../db.config/index.js';

async function migrate() {
  try {
    console.log('Connected to DB, dropping notification.item_id foreign key if exists...');

    // Check if constraint exists
    const check = await pool.query("SELECT constraint_name FROM information_schema.table_constraints WHERE table_name='notification' AND constraint_type='FOREIGN KEY';");
    const fks = check.rows.map(r => r.constraint_name);
    if (fks.includes('notification_item_id_fkey')) {
      console.log('Dropping constraint notification_item_id_fkey');
      await pool.query('ALTER TABLE notification DROP CONSTRAINT notification_item_id_fkey;');
    } else {
      console.log('Constraint notification_item_id_fkey not present');
    }

    console.log('Migration completed.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
