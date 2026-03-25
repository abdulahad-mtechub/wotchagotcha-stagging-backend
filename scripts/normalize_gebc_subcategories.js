import pool from '../db.config/index.js';
import fs from 'fs';

(async ()=>{
  try{
    console.log('Inspecting GEBC categories and subcategories...');
    const catsRes = await pool.query('SELECT id, name FROM GEBC_category ORDER BY id');
    const report = [];
    for(const cat of catsRes.rows){
      const subsRes = await pool.query('SELECT id, name FROM GEBC_sub_category WHERE category_id=$1 ORDER BY id', [cat.id]);
      report.push({ category: cat, subcategories: subsRes.rows });
    }

    const backupPath = 'scripts/backup_gebc_subcategories.json';
    fs.writeFileSync(backupPath, JSON.stringify(report, null, 2));
    console.log('Backup written to', backupPath);

    // Normalize per category
    for(const entry of report){
      const catId = entry.category.id;
      const subs = entry.subcategories;
      if(subs.length <= 2){
        console.log(`Category ${catId} already has ${subs.length} subcategories, skipping.`);
        continue;
      }

      // Find existing 'All others' (case-insensitive)
      let allOthers = subs.find(s => s.name && s.name.toLowerCase().trim() === 'all others');
      // Find 'Emotions & Feelings' if present
      let combined = subs.find(s => s.name && s.name.toLowerCase().includes('emotions & feelings'));

      // If combined not found, try to find 'Actions & Reactions' or 'Objects & Places'
      if(!combined){
        combined = subs.find(s => s.name && (s.name.toLowerCase().includes('actions & reactions') || s.name.toLowerCase().includes('objects & places')));
      }

      // If still not found, pick first subcategory as combined
      if(!combined){
        combined = subs[0];
      }

      // If no All others, pick last subcategory as All others (unless it's the same as combined)
      if(!allOthers){
        // pick a sub that's not combined
        allOthers = subs.slice().reverse().find(s => s.id !== combined.id);
      }

      // Sanity: ensure combined and allOthers exist and are distinct
      if(!combined || !allOthers){
        console.log(`Category ${catId}: failed to pick combined/allOthers subcategories, skipping.`);
        continue;
      }
      if(combined.id === allOthers.id){
        // pick another for allOthers
        allOthers = subs.find(s => s.id !== combined.id) || combined;
      }

      console.log(`Category ${catId}: combined=${combined.id}('${combined.name}') allOthers=${allOthers.id}('${allOthers.name}')`);

      // Rename combined to the requested combined name
      const combinedName = 'Emotions & Feelings  Actions & Reactions  Objects & Places';
      await pool.query('UPDATE GEBC_sub_category SET name=$1, updated_at=NOW() WHERE id=$2', [combinedName, combined.id]);

      // Rename allOthers to exact 'All others'
      await pool.query('UPDATE GEBC_sub_category SET name=$1, updated_at=NOW() WHERE id=$2', ['All others', allOthers.id]);

      // Reassign GEBC rows from other subcats to allOthers
      const otherIds = subs.map(s=>s.id).filter(id => id !== combined.id && id !== allOthers.id);
      if(otherIds.length>0){
        const q = `UPDATE GEBC SET sub_category=$1, updated_at=NOW() WHERE category=$2 AND sub_category = ANY($3::int[]) RETURNING id`;
        const res = await pool.query(q, [allOthers.id, catId, otherIds]);
        console.log(`  Reassigned ${res.rowCount} GEBC rows from subcategories [${otherIds.join(', ')}] to ${allOthers.id}`);

        // Delete other subcategories
        const delQ = `DELETE FROM GEBC_sub_category WHERE id = ANY($1::int[]) RETURNING id, name`;
        const delRes = await pool.query(delQ, [otherIds]);
        console.log(`  Deleted ${delRes.rowCount} subcategory rows:`, delRes.rows.map(r=>r.id).join(', '));
      } else {
        console.log('  No other subcategories to reassign/delete.');
      }
    }

    console.log('Normalization complete.');
    process.exit(0);
  }catch(err){
    console.error('Error:', err);
    process.exit(1);
  }
})();
