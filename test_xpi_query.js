import pool from './db.config/index.js';

async function testQuery() {
    const id = 38;
    const perPage = 1000;
    const offset = 0;

    const query = `
  SELECT
    v.id AS video_id,
    v.name,
    v.description,
    v.video_category,
    vc.name AS category_name,
    vc.french_name AS category_french_name,
    v.sub_category,
    vsc.name AS sub_category_name,
    vsc.french_name AS sub_category_french_name,
    vsc."index" AS sub_category_index,
    orig_vsc.name AS original_sub_category_name,
    orig_vsc.french_name AS original_sub_category_french_name,
    orig_vsc."index" AS original_sub_category_index,
    v.video,
    v.thumbnail,
    v.created_at AS video_created_at,
    v.user_id,
    v.shared_post_id,
    u.username AS username, 
    u.image AS user_image,  
    (
      SELECT COUNT(*) FROM video_comment vc WHERE vc.video_id = v.id
    ) AS comment_count,
    (
      SELECT COUNT(*) FROM like_video lv WHERE lv.video_id = v.id
    ) AS total_likes,
    -- Original post details
    orig.name AS original_name,
    orig.description AS original_description,
    orig.video AS original_video,
    orig.thumbnail AS original_thumbnail,
    orig.sub_category AS original_sub_category_id,
    orig_vsc.name AS original_sub_category_name_2,
    orig_vsc.french_name AS original_sub_category_french_name_2,
    orig_vsc."index" AS original_sub_category_index_2,
    orig_u.username AS original_username,
    orig_u.image AS original_user_image,
    orig.created_at AS original_created_at
  FROM xpi_videos v
  JOIN users u ON v.user_id = u.id
  LEFT JOIN video_category vc ON v.video_category = vc.id
  LEFT JOIN video_sub_category vsc ON v.sub_category = vsc.id
  LEFT JOIN xpi_videos orig ON v.shared_post_id = orig.id
  LEFT JOIN users orig_u ON orig.user_id = orig_u.id
  LEFT JOIN video_sub_category orig_vsc ON orig.sub_category = orig_vsc.id
  WHERE (v.video_category = $1 OR (v.shared_post_id IS NOT NULL AND orig.video_category = $1))
    AND u.is_deleted = FALSE AND v.status != 'blocked'
  ORDER BY v.created_at DESC
  LIMIT $2 OFFSET $3;
  `;

    try {
        console.log("Running query for category 38...");
        const { rows } = await pool.query(query, [id, perPage, offset]);
        console.log(`Query returned ${rows.length} rows.`);

        const record2014 = rows.find(r => r.video_id === 2014);
        if (record2014) {
            console.log("Record 2014 found in query result!");
            console.log(JSON.stringify(record2014, null, 2));
        } else {
            console.log("Record 2014 NOT found in query result.");

            // Let's see why it might be filtered out
            console.log("Checking record 2014 directly...");
            const check = await pool.query(`
        SELECT v.id, v.video_category, v.status, u.is_deleted, orig.video_category as orig_cat
        FROM xpi_videos v
        JOIN users u ON v.user_id = u.id
        LEFT JOIN xpi_videos orig ON v.shared_post_id = orig.id
        WHERE v.id = 2014
      `);
            console.table(check.rows);
        }

        // Check if there are ANY records with category 38
        const anyCat38 = await pool.query("SELECT id FROM xpi_videos WHERE video_category = 38");
        console.log(`Direct check: ${anyCat38.rows.length} videos have video_category = 38`);

    } catch (error) {
        console.error("Error running test query:", error);
    } finally {
        process.exit();
    }
}

testQuery();
