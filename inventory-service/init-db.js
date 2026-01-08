const mysql = require('mysql2/promise');
require('dotenv').config();

// KREDENSIAL DATABASE RAILWAY
// Ganti nilai ini dengan data dari Tab "DATA" atau "CONNECT" di Railway
const config = {
    host: 'maglev.proxy.rlwy.net',
    port: 42999,
    user: 'root',
    password: 'QZCsFVUWZksNdhtJHfsSNGpBWxaHKhkc',
    database: 'railway'
};

const createTables = async () => {
    try {
        console.log('Connecting to database...');
        const connection = await mysql.createConnection(config);
        console.log('Connected!');

        const queries = [
            `CREATE TABLE IF NOT EXISTS suppliers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                contact_info VARCHAR(255),
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS ingredients (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                unit VARCHAR(50) NOT NULL,
                stock FLOAT DEFAULT 0,
                min_stock FLOAT DEFAULT 0,
                supplier_id INT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
            )`,
            `CREATE TABLE IF NOT EXISTS stock_movements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ingredient_id INT NOT NULL,
                type ENUM('IN', 'OUT', 'ADJUSTMENT') NOT NULL,
                quantity FLOAT NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
            )`,
            `CREATE TABLE IF NOT EXISTS purchase_orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                supplier_id INT NOT NULL,
                status ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED') DEFAULT 'PENDING',
                total_amount DECIMAL(10, 2) DEFAULT 0,
                order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
            )`,
            `CREATE TABLE IF NOT EXISTS purchase_order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                purchase_order_id INT NOT NULL,
                ingredient_id INT NOT NULL,
                quantity FLOAT NOT NULL,
                price_per_unit DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
                FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
            )`,
            // Seed Data Dummy
            `INSERT INTO suppliers (name, contact_info, address) VALUES 
            ('Supplier Sayur Segar', '08123456789', 'Jl. Kebun Sayur No. 1'),
            ('Toko Daging Barokah', '08987654321', 'Pasar Baru Blok A')`
        ];

        for (const query of queries) {
            await connection.execute(query);
            console.log('Query executed successfully');
        }

        console.log('🎉 Database Initialized Successfully!');
        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

createTables();
