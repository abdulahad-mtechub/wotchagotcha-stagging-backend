import pool from './db.config/index.js';

async function insertTopRecord() {
  console.log("Starting insertion...");
  try {
    const itemData = {
      user_id: 13, // seed_mondo
      item_category: 107, // Musical Instruments
      title: "Custom Shop Electric Guitar - Red Flare",
      description: "Experience unparalleled tone with this Custom Shop Electric Guitar. Featuring a stunning Red Flare finish, gold-plated hardware, and hand-wound pickups. This top-tier instrument offers exceptional sustain and a rich, harmonic-filled sound. Perfect for professional stage performances and high-end studio recording.",
      price: 3200,
      condition: "new",
      location: "London, UK",
      region: "uk",
      top_post: true,
      top_added_date: new Date(),
      paid_status: true,
      status: "active",
      country_code: "GB",
      country: "United Kingdom"
    };

    const insertItemQuery = `
      INSERT INTO item (
        user_id, item_category, title, description, price, condition, 
        location, region, top_post, top_added_date, paid_status, 
        status, country_code, country
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
      RETURNING id;
    `;

    console.log("Executing insert item query...");
    const result = await pool.query(insertItemQuery, [
      itemData.user_id,
      itemData.item_category,
      itemData.title,
      itemData.description,
      itemData.price,
      itemData.condition,
      itemData.location,
      itemData.region,
      itemData.top_post,
      itemData.top_added_date,
      itemData.paid_status,
      itemData.status,
      itemData.country_code,
      itemData.country
    ]);

    const itemId = result.rows[0].id;
    console.log(`Item inserted with ID: ${itemId}`);

    const imageUrl = "/itemImages/premium_guitar.png";
    console.log("Executing insert image query...");
    await pool.query(
      "INSERT INTO item_images (item_id, image) VALUES ($1, $2)",
      [itemId, imageUrl]
    );
    console.log(`Image record inserted for item ${itemId}`);

    console.log("SUCCESS");
    process.exit(0);
  } catch (err) {
    console.error("ERROR OCCURRED:");
    console.error(err);
    process.exit(1);
  }
}

insertTopRecord();
