
import pool from "./db.config/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    const sqlPath = path.join(__dirname, "migrations", "drop_all_module_category_fks.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    try {
        console.log("Running consolidated migration to drop all category FKs...");
        await pool.query(sql);
        console.log("Migration completed successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        process.exit();
    }
}

runMigration();
