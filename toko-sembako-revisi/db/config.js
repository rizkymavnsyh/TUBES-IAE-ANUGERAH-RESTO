const mysql = require('mysql2/promise');

// Konfigurasi database - dapat diubah via environment variables
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3308,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toko_sembako',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

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
