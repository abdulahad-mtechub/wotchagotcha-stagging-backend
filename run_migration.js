
import pool from "./db.config/index.js";
import fs from "fs";

const migrateSql = fs.readFileSync("migrate_sharing.sql").toString();

console.log("Starting migration...");
pool.query(migrateSql, (err, result) => {
    if (!err) {
        console.log("Migration completed successfully!");
        process.exit(0);
    } else {
        console.error("Migration failed:");
        console.error(err.stack);
        process.exit(1);
    }
});
