import pool from "./db.config/index.js";

async function verifyFixes() {
    console.log("Starting verification of cross-module category saving...");

    const testUserId = 54;
    const foreignCategoryId = 2;
    const subCategoryId = 515;

    const modules = [
        { table: "pic_tours", name: "PicTour", catField: "pic_category", subField: "sub_category", nameField: "name" },
        { table: "qafi", name: "Qafi", catField: "category", subField: "sub_category", nameField: "description" },
        { table: "gebc", name: "GEBC", catField: "category", subField: "sub_category", nameField: "description" },
        { table: "news", name: "News", catField: "category", subField: "sub_category", nameField: "description" },
        { table: "cinematics_videos", name: "Cinematic", catField: "category_id", subField: "sub_category_id", nameField: "name" },
        { table: "fan_star_videos", name: "FanStar", catField: "category_id", subField: "sub_category_id", nameField: "name" },
        { table: "tv_progmax_videos", name: "TVProgmax", catField: "category_id", subField: "sub_category_id", nameField: "name" },
        { table: "kid_vids_videos", name: "KidVids", catField: "category_id", subField: "sub_category_id", nameField: "name" },
        { table: "learning_hobbies_videos", name: "LearningHobbies", catField: "category_id", subField: "sub_category_id", nameField: "name" },
        { table: "sports", name: "Sports", catField: "category_id", subField: "sub_category_id", nameField: "name" },
        { table: "item", name: "Item", catField: "item_category", subField: "sub_category", nameField: "title" },
        { table: "xpi_videos", name: "Xpi", catField: "video_category", subField: "sub_category", nameField: "name" }
    ];

    for (const mod of modules) {
        try {
            console.log(`Testing module: ${mod.name}...`);

            const insertQuery = `
        INSERT INTO ${mod.table} (user_id, ${mod.catField}, ${mod.subField}, ${mod.nameField}, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `;
            const values = [testUserId, foreignCategoryId, subCategoryId, `Verification Test ${mod.name}`, "Test Desc"];

            const result = await pool.query(insertQuery, values);
            console.log(`✅ ${mod.name} record created with ID: ${result.rows[0].id}`);

            // Cleanup
            await pool.query(`DELETE FROM ${mod.table} WHERE id = $1`, [result.rows[0].id]);
            console.log(`✅ ${mod.name} record cleaned up.`);

        } catch (error) {
            console.error(`❌ Failed verification for ${mod.name}:`, error.message);
        }
    }

    process.exit();
}

verifyFixes();
