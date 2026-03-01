import pool from "./db.config/index.js";
import { getItemSubCategories } from "./Controllers/itemSubCategoryController.js";

async function verifySharedPostPopulation() {
    const req = {
        query: {
            main_category_id: 110,
            limit: 1,
            include_items: '1',
            item_limit: 5
        }
    };

    const res = {
        status: (code) => {
            console.log(`Status Code: ${code}`);
            return res;
        },
        json: (data) => {
            console.log("Response Data Structure:", Object.keys(data));
            if (data.data && data.data[0]) {
                console.log("First Subcategory Name:", data.data[0].name);
                if (data.data[0].items && data.data[0].items.length > 0) {
                    console.log("First Item details:", JSON.stringify(data.data[0].items[0], null, 2));
                } else {
                    console.log("No items found in first subcategory.");
                }
            }
            return res;
        }
    };

    try {
        console.log("Running getItemSubCategories...");
        await getItemSubCategories(req, res);
        console.log("Test finished.");
    } catch (error) {
        console.error("Test failed with error:", error);
    } finally {
        process.exit(0);
    }
}

verifySharedPostPopulation();
