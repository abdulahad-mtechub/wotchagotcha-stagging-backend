

// export const databaseConfig = {
//     // user: 'watchgoth_user',
//     // host: 'postgres-staging-projects.mtechub.com',
//     // database: 'watchgotha_db',
//     // password: 'mtechub123',
//     // port: 5432,
//     host: 'postgres-staging-projects.mtechub.com',
//     user: 'postgres',
//     database: 'watchgotha',
//     password: 'mtechub123',
//     port: 5432,
// };




export const databaseConfig = {
    host: process.env.DB_HOST || 'postgres-testing.cp.mtechub.org',
    user: process.env.DB_USER || 'postgres',
    database: process.env.DB_NAME || 'watchgotha',
    password: process.env.DB_PASSWORD || 'Mtechub@123',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
};


