
import pkg from "pg";
const { Pool } = pkg;

const databaseConfig = {
    host: 'postgres-testing.cp.mtechub.org',
    user: 'postgres',
    database: 'watchagocha-db',
    password: 'Mtechub@123',
    port: 5432,
};

const pool = new Pool(databaseConfig);

async function verifyCounts() {
    try {
        const queries = {
            total_items: "SELECT COUNT(*) FROM public.item",
            currently_top: "SELECT COUNT(*) FROM public.item WHERE top_post = TRUE",
            valid_top_items: "SELECT COUNT(*) FROM public.item WHERE top_post = TRUE AND paid_status = TRUE",
            ready_for_top: "SELECT COUNT(*) FROM public.item WHERE paid_status = TRUE AND top_post = FALSE"
        };

        const results = {};
        for (const [key, query] of Object.entries(queries)) {
            const { rows } = await pool.query(query);
            results[key] = parseInt(rows[0].count);
        }
        console.log(JSON.stringify(results, null, 2));
    } catch (err) {
        console.error("Error running verification queries:", err);
    } finally {
        await pool.end();
    }
}

verifyCounts();
