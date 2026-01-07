const db = require('./connection');
require('dotenv').config();

async function migrate() {
  try {
    console.log('🔄 Running Order Service migrations...');

    // Create menus table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS menus (
        id INT AUTO_INCREMENT PRIMARY KEY,
        menu_id VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(255),
        ingredients JSON,
        available BOOLEAN DEFAULT TRUE,
        preparation_time INT DEFAULT 15,
        tags JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_menu_id (menu_id),
        INDEX idx_available (available)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create carts table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS carts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cart_id VARCHAR(255) NOT NULL UNIQUE,
        customer_id VARCHAR(255),
        table_number VARCHAR(50),
        items JSON,
        subtotal DECIMAL(10, 2) DEFAULT 0,
        tax DECIMAL(10, 2) DEFAULT 0,
        service_charge DECIMAL(10, 2) DEFAULT 0,
        discount DECIMAL(10, 2) DEFAULT 0,
        total DECIMAL(10, 2) DEFAULT 0,
        status ENUM('active', 'abandoned', 'completed') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cart_id (cart_id),
        INDEX idx_customer_id (customer_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create orders table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(255) NOT NULL UNIQUE,
        customer_id VARCHAR(255),
        table_number VARCHAR(50),
        items JSON NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        tax DECIMAL(10, 2) DEFAULT 0,
        service_charge DECIMAL(10, 2) DEFAULT 0,
        discount DECIMAL(10, 2) DEFAULT 0,
        loyalty_points_used DECIMAL(10, 2) DEFAULT 0,
        loyalty_points_earned DECIMAL(10, 2) DEFAULT 0,
        total DECIMAL(10, 2) NOT NULL,
        payment_method ENUM('cash', 'card', 'digital_wallet', 'loyalty_points') DEFAULT 'cash',
        payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
        order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled') DEFAULT 'pending',
        kitchen_status ENUM('pending', 'preparing', 'ready', 'completed') DEFAULT 'pending',
        staff_id VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        INDEX idx_order_id (order_id),
        INDEX idx_customer_id (customer_id),
        INDEX idx_table_number (table_number),
        INDEX idx_order_status (order_status),
        INDEX idx_payment_status (payment_status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Insert sample menu items
    await db.execute(`
      INSERT IGNORE INTO menus (id, menu_id, name, description, category, price, ingredients, available, preparation_time) VALUES
      (1, 'MENU001', 'Nasi Goreng Spesial', 'Nasi goreng dengan telur, ayam, dan sayuran', 'main_course', 25000, '[]', true, 15),
      (2, 'MENU002', 'Mie Goreng', 'Mie goreng dengan bumbu spesial', 'main_course', 22000, '[]', true, 12),
      (3, 'MENU003', 'Ayam Bakar', 'Ayam bakar dengan bumbu kecap', 'main_course', 35000, '[]', true, 20),
      (4, 'MENU004', 'Soto Ayam', 'Soto ayam dengan kuah bening', 'soup', 20000, '[]', true, 15),
      (5, 'MENU005', 'Es Teh Manis', 'Teh manis dingin', 'beverage', 5000, '[]', true, 3),
      (6, 'MENU006', 'Es Jeruk', 'Jeruk peras segar', 'beverage', 8000, '[]', true, 3),
      (7, 'MENU007', 'Pisang Goreng', 'Pisang goreng crispy', 'dessert', 10000, '[]', true, 10),
      (8, 'MENU008', 'Gado-Gado', 'Sayuran segar dengan bumbu kacang', 'appetizer', 18000, '[]', true, 10);
    `);

    console.log('✅ Order Service migrations completed');
    return true;
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

// Export for use as module
module.exports = migrate;

// Run directly if called as main script
if (require.main === module) {
  migrate().then(() => process.exit(0)).catch(() => process.exit(1));
}







