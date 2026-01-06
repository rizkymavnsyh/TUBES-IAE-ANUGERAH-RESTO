const mysql = require('mysql2/promise');

// Konfigurasi database - support Railway env vars (MYSQL*) dan custom (DB_*)
// Default ke localhost hanya untuk dev local tanpa docker
const dbConfig = {
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    port: process.env.MYSQLPORT || process.env.DB_PORT || 3308,
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'toko_sembako',
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
