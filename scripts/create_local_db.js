import pkg from "pg";

const { Client } = pkg;

const client = new Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "umar",
  database: "postgres",
});

async function run() {
  await client.connect();
  await client.query('CREATE DATABASE "watchagocha-db";');
  console.log('Database "watchagocha-db" created successfully');
  await client.end();
}

run().catch(async (err) => {
  console.error(err.message);
  try {
    await client.end();
  } catch {}
  process.exit(1);
});
