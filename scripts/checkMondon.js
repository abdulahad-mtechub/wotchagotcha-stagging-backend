import pool from '../db.config/index.js';

const id = process.argv[2] || '82';

async function main() {
  try {
    console.log('Checking id:', id);
    const mondon = await pool.query('SELECT * FROM mondon_market WHERE id=$1', [id]);
    console.log('\n-- mondon_market --');
    console.log(mondon.rows);

    const item = await pool.query('SELECT * FROM item WHERE id=$1', [id]);
    console.log('\n-- item --');
    console.log(item.rows);

    const user = await pool.query('SELECT id, username FROM users WHERE id=$1', [7]);
    console.log('\n-- user (id=7) --');
    console.log(user.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
