import pool from '../db.config/index.js';

async function migrate() {
  try {
    console.log('Connected to DB, starting migration...');

    // Drop existing fk constraint if present
    await pool.query("ALTER TABLE IF EXISTS mondon_market_comment DROP CONSTRAINT IF EXISTS mondon_market_comment_mondon_market_id_fkey;");

    // If column mondon_market_id exists and item_id does not, rename it
    const colCheck = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='mondon_market_comment' AND column_name IN ('mondon_market_id','item_id')");
    const cols = colCheck.rows.map(r => r.column_name);
    if (cols.includes('mondon_market_id') && !cols.includes('item_id')) {
      console.log('Renaming mondon_market_id -> item_id');
      await pool.query("ALTER TABLE mondon_market_comment RENAME COLUMN mondon_market_id TO item_id;");
    }

    // Add FK to item.id
    await pool.query("ALTER TABLE IF EXISTS mondon_market_comment DROP CONSTRAINT IF EXISTS mondon_market_comment_item_id_fkey;");
    await pool.query("ALTER TABLE mondon_market_comment ADD CONSTRAINT mondon_market_comment_item_id_fkey FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE CASCADE;");

    console.log('Migration completed.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
