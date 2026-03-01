import pool from "./db.config/index.js";
import { createItem } from "./Controllers/itemController.js";

async function verifyFix() {
    const req = {
        body: {
            user_id: 7, // Using user_id 7 from the error report
            item_category: 110,
            shared_post_id: 1842,
            description: "Verification Test",
            title: "Test Item",
            price: 10,
            condition: "new",
            location: "Test Location",
            region: "us",
            paid_status: "paid" // Should map to true
        }
    };

    const res = {
        status: (code) => {
            console.log(`Status Code: ${code}`);
            return res;
        },
        json: (data) => {
            console.log("Response Data:", JSON.stringify(data, null, 2));
            return res;
        }
    };

    try {
        console.log("Running createItem with paid_status='unpaid'...");
        await createItem(req, res);
        console.log("Test finished.");
    } catch (error) {
        console.error("Test failed with error:", error);
    } finally {
        process.exit(0);
    }
}

verifyFix();
