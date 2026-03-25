import pool from '../db.config/index.js';

async function migrate() {
  try {
    console.log('Connected to DB, starting add is_all_user migration...');

    const colCheck = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='notification' AND column_name='is_all_user'");
    const cols = colCheck.rows.map(r => r.column_name);

    if (!cols.includes('is_all_user')) {
      console.log('Adding column is_all_user');
      await pool.query("ALTER TABLE notification ADD COLUMN is_all_user BOOLEAN DEFAULT FALSE;");
    } else {
      console.log('Column is_all_user already exists');
    }

    console.log('Migration completed.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
