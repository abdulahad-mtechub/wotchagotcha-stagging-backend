
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

async function setCountryInfo() {
    try {
        const ids = [1842, 1844, 1845, 1846, 1847, 1848, 1833, 1834, 1835, 1836, 1839, 1841, 1849, 1850, 1851, 1852, 1857, 1860, 1861, 1862, 1863, 1864, 1865, 1866];
        
        // 1. Set specific values based on location
        await pool.query("UPDATE public.item SET country = 'Canada', country_code = 'CA' WHERE id = 1860;");
        
        // 2. Set default for others that are null
        const updateQuery = `
            UPDATE public.item 
            SET country = 'Pakistan', country_code = 'PK' 
            WHERE id = ANY($1) AND country IS NULL;
        `;
        
        const { rowCount } = await pool.query(updateQuery, [ids]);
        console.log(`Updated country info for ${rowCount} records.`);
    } catch (err) {
        console.error("Error updating country data:", err);
    } finally {
        await pool.end();
    }
}

setCountryInfo();
