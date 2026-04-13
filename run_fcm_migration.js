import pool from "./db.config/index.js";

const checkSql = `
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'users';
`;

const migrateSql = `
  ALTER TABLE users
  ADD COLUMN IF NOT EXISTS fcm_token VARCHAR(300);
`;

const updateDeviceTokenSql = `
  ALTER TABLE users
  ADD COLUMN IF NOT EXISTS device_token VARCHAR(300);
`;

pool.query(migrateSql, (err, res) => {
  if (err) {
    console.error("Migration failed:", err);
  } else {
    console.log("Migration SUCCESS: fcm_token added or already exists.");
  }
  process.exit(0);
});
