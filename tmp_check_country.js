
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

async function checkCountryData() {
    try {
        const ids = [1842, 1844, 1845, 1846, 1847, 1848, 1833, 1834, 1835, 1836, 1839, 1841, 1849, 1850, 1851, 1852, 1857, 1860, 1861, 1862, 1863, 1864, 1865, 1866];
        const query = `
            SELECT id, region, location, country, country_code 
            FROM public.item 
            WHERE id = ANY($1);
        `;
        
        const { rows } = await pool.query(query, [ids]);
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error("Error checking country data:", err);
    } finally {
        await pool.end();
    }
}

checkCountryData();
