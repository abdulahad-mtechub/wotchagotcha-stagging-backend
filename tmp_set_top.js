
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

async function setTopRecords() {
    try {
        console.log("Starting update...");
        const updateQuery = `
            UPDATE public.item 
            SET top_post = TRUE, top_added_date = NOW() 
            WHERE paid_status = TRUE AND top_post = FALSE
            RETURNING id;
        `;
        
        const { rows, rowCount } = await pool.query(updateQuery);
        console.log(`Successfully updated ${rowCount} records.`);
        if (rowCount > 0) {
            console.log("Updated IDs:", rows.map(r => r.id).join(", "));
        }
    } catch (err) {
        console.error("Error running update query:", err);
    } finally {
        await pool.end();
    }
}

setTopRecords();
