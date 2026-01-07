const db = require('./connection');
require('dotenv').config();

async function migrate() {
  try {
    console.log('🔄 Running Inventory Service migrations...');

    // Create suppliers table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create ingredients table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        category VARCHAR(100),
        min_stock_level DECIMAL(10, 2) DEFAULT 0,
        current_stock DECIMAL(10, 2) DEFAULT 0,
        supplier_id INT,
        cost_per_unit DECIMAL(10, 2) DEFAULT 0,
        status ENUM('active', 'inactive', 'out_of_stock') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
        INDEX idx_category (category),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create stock_movements table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ingredient_id INT NOT NULL,
        movement_type ENUM('in', 'out', 'adjustment') NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        reason VARCHAR(255),
        reference_id VARCHAR(255),
        reference_type VARCHAR(100),
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
        INDEX idx_ingredient (ingredient_id),
        INDEX idx_movement_type (movement_type),
        INDEX idx_reference (reference_type, reference_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create purchase_orders table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        supplier_id INT NOT NULL,
        order_number VARCHAR(255) UNIQUE NOT NULL,
        status ENUM('pending', 'ordered', 'received', 'cancelled') DEFAULT 'pending',
        total_amount DECIMAL(10, 2) DEFAULT 0,
        order_date DATE,
        expected_delivery_date DATE,
        received_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
        INDEX idx_status (status),
        INDEX idx_order_number (order_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create purchase_order_items table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        purchase_order_id INT NOT NULL,
        ingredient_id INT NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        price_per_unit DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        received_quantity DECIMAL(10, 2) DEFAULT 0,
        FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Check and add price_per_unit if missing (fix for existing containers)
    try {
      const [columns] = await db.execute("SHOW COLUMNS FROM purchase_order_items LIKE 'price_per_unit'");
      if (columns.length === 0) {
        console.log('⚠️ Column price_per_unit missing in purchase_order_items. Adding it...');
        await db.execute("ALTER TABLE purchase_order_items ADD COLUMN price_per_unit DECIMAL(10, 2) NOT NULL AFTER unit_price");
        console.log('✅ Added missing price_per_unit column');
      }
    } catch (err) {
      console.error('⚠️ Could not check/add price_per_unit column:', err.message);
    }

    // Note: Inventory data (ingredients, suppliers) comes from Toko Sembako cloud integration
    // No local seed data needed - data will be synced from:
    // https://toko-sembako-revisi-production.up.railway.app

    console.log('✅ Inventory Service migrations completed');
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








