import pool from '../db.config/index.js';

async function migrate() {
  try {
    console.log('Connected to DB, starting notification columns migration...');

    const colCheck = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='notification' AND column_name IN ('moduletype','item_id')");
    const cols = colCheck.rows.map(r => r.column_name);

    if (!cols.includes('moduletype')) {
      console.log('Adding column moduletype');
      await pool.query("ALTER TABLE notification ADD COLUMN moduletype VARCHAR(255);");
    } else {
      console.log('Column moduletype already exists');
    }

    if (!cols.includes('item_id')) {
      console.log('Adding column item_id');
      await pool.query("ALTER TABLE notification ADD COLUMN item_id INT;");
      console.log('Adding foreign key constraint for item_id');
      await pool.query("ALTER TABLE notification ADD CONSTRAINT notification_item_id_fkey FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE CASCADE;");
    } else {
      console.log('Column item_id already exists');
    }

    console.log('Migration completed.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
