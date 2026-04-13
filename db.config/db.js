import "dotenv/config";

export const databaseConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME || "watchagocha-db",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
};


