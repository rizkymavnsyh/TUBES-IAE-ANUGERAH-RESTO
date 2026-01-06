const mysql = require('mysql2/promise');

// Parse DATABASE_URL if available (Railway standard)
let dbUrlConfig = {};
if (process.env.DATABASE_URL) {
    try {
        const url = new URL(process.env.DATABASE_URL);
        dbUrlConfig = {
            host: url.hostname,
            port: url.port || 3306,
            user: url.username,
            password: url.password,
            database: url.pathname.substring(1) // Remove leading slash
        };
        console.log('🔗 Using DATABASE_URL configuration');
    } catch (e) {
        console.error('❌ Failed to parse DATABASE_URL:', e.message);
    }
}

// Konfigurasi database - support Railway env vars (MYSQL*) dan custom (DB_*)
// Default ke localhost hanya untuk dev local tanpa docker
const dbConfig = {
    host: dbUrlConfig.host || process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    port: dbUrlConfig.port || process.env.MYSQLPORT || process.env.DB_PORT || 3308,
    user: dbUrlConfig.user || process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: dbUrlConfig.password || process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: dbUrlConfig.database || process.env.MYSQLDATABASE || process.env.DB_NAME || 'toko_sembako',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

console.log(`🔌 Database Config: ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

// Create connection pool
let pool = null;

async function getPool() {
    if (!pool) {
        pool = mysql.createPool(dbConfig);
    }
    return pool;
}

async function query(sql, params = []) {
    const p = await getPool();
    const [rows] = await p.execute(sql, params);
    return rows;
}

async function queryInsert(sql, params = []) {
    const p = await getPool();
    const [result] = await p.execute(sql, params);
    return result;
}

module.exports = {
    getPool,
    query,
    queryInsert,
    dbConfig
};
