import pool from '../db.config/index.js';

(async function run() {
  const client = await pool.connect();
  try {
    const { rows: parents } = await client.query('SELECT id, name FROM disc_category ORDER BY id');
    console.log(`Found ${parents.length} parent categories.`);

    const created = [];
    const skipped = [];

    for (const p of parents) {
      const existsQ = 'SELECT id FROM disc_sub_category WHERE category_id=$1 AND LOWER(name)=LOWER($2) LIMIT 1';
      const { rows: existRows } = await client.query(existsQ, [p.id, 'Public']);
      if (existRows.length > 0) {
        skipped.push({ parentId: p.id, parentName: p.name, subId: existRows[0].id });
        continue;
      }

      const insertQ = 'INSERT INTO disc_sub_category (name, category_id) VALUES ($1, $2) RETURNING *';
      const { rows: ins } = await client.query(insertQ, ['Public', p.id]);
      created.push({ parentId: p.id, parentName: p.name, sub: ins[0] });
    }

    console.log(`Created ${created.length} new 'Public' subcategories.`);
    if (skipped.length) console.log(`Skipped ${skipped.length} existing.`);

    if (created.length) console.log('Created samples:', created.slice(0,5));
  } catch (err) {
    console.error('Error creating public subcategories:', err.stack || err);
    process.exitCode = 1;
  } finally {
    client.release();
    process.exit();
  }
})();
