import fs from "fs";
import path from "path";
import pool from "../db.config/index.js";

const migrationsDir = path.join(process.cwd(), "migrations");

async function run() {
  try {
    if (!fs.existsSync(migrationsDir)) {
      console.error("Migrations directory not found:", migrationsDir);
      process.exit(1);
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("No migration files found.");
      process.exit(0);
    }

    for (const file of files) {
      const sqlPath = path.join(migrationsDir, file);
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(sqlPath, "utf8");
      await pool.query(sql);
      console.log(`Executed migration: ${file}`);
    }

    console.log("All migrations executed successfully");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err.stack || err);
    process.exit(1);
  }
}

run();
