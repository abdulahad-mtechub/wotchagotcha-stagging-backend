import pool from '../db.config/index.js';

async function migrate() {
  try {
    console.log('Connected to DB, starting notification reference columns migration...');

    const colCheck = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='notification' AND column_name IN ('action','reference_table','reference_id')");
    const cols = colCheck.rows.map(r => r.column_name);

    if (!cols.includes('action')) {
      console.log('Adding column action');
      await pool.query("ALTER TABLE notification ADD COLUMN action VARCHAR(50);");
    } else {
      console.log('Column action already exists');
    }

    if (!cols.includes('reference_table')) {
      console.log('Adding column reference_table');
      await pool.query("ALTER TABLE notification ADD COLUMN reference_table VARCHAR(255);");
    } else {
      console.log('Column reference_table already exists');
    }

    if (!cols.includes('reference_id')) {
      console.log('Adding column reference_id');
      await pool.query("ALTER TABLE notification ADD COLUMN reference_id INT;");
    } else {
      console.log('Column reference_id already exists');
    }

    console.log('Migration completed.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
