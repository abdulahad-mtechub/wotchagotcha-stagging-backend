import fs from "fs";
import pool from "../db.config/index.js";

const fileArg = process.argv[2] || "migrations/make_categories_nullable.sql";

try {
  const sql = fs.readFileSync(fileArg, "utf8");
  console.log(`Applying SQL file: ${fileArg}`);
  pool.query(sql, (err, result) => {
    if (!err) {
      console.log("SQL executed successfully");
      process.exit(0);
    } else {
      console.error("SQL execution failed:");
      console.error(err.stack || err);
      process.exit(1);
    }
  });
} catch (err) {
  console.error(`Failed to read file ${fileArg}:`, err.message || err);
  process.exit(2);
}
