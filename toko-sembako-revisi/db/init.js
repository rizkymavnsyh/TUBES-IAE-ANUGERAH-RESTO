const mysql = require('mysql2/promise');
const { dbConfig } = require('./config');

async function initDatabase() {
    console.log('🔧 Initializing database...');

    // First connect without database to create it if not exists
    const connection = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port || 3308,
        user: dbConfig.user,
        password: dbConfig.password
    });

    // Create database if not exists
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    console.log(`✅ Database '${dbConfig.database}' ready`);

    // Use the database
    await connection.changeUser({ database: dbConfig.database });

    // Create tables
    const tables = [
        // Products table
        `CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price INT NOT NULL,
            unit VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        // Inventory table
        `CREATE TABLE IF NOT EXISTS inventory (
            product_id INT PRIMARY KEY,
            stock INT DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,

        // Orders table
        `CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            restaurant_id VARCHAR(100) NOT NULL,
            total INT DEFAULT 0,
            status VARCHAR(50) DEFAULT 'CONFIRMED',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        // Order items table
        `CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            qty INT NOT NULL,
            price INT NOT NULL,
            subtotal INT NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        )`,

        // Users table
        `CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    for (const sql of tables) {
        await connection.execute(sql);
    }

    // Migration: Add description column to products if not exists
    try {
        await connection.execute(`
            ALTER TABLE products 
            ADD COLUMN description TEXT
        `);
        console.log('✅ Added "description" column to products table');
    } catch (err) {
        // Ignore duplicate column error
    }

    // Migration: Add category column to products if not exists
    try {
        await connection.execute(`
            ALTER TABLE products 
            ADD COLUMN category VARCHAR(50)
        `);
        console.log('✅ Added "category" column to products table');
    } catch (err) {
        // Ignore duplicate column error
    }

    console.log('✅ All tables created/verified');
    await connection.end();

    return true;
}

module.exports = { initDatabase };
