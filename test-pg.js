import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();
const { Client } = pkg;

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'your_postgres_password',
  database: process.env.DB_NAME || 'watchgotha',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
});

client.connect()
  .then(() => {
    console.log('connected to Postgres');
    return client.end();
  })
  .catch((e) => {
    console.error('connection error:', e.message);
    console.error(e);
    process.exit(1);
  });
