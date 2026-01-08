const db = require('./connection');
require('dotenv').config();

async function migrate() {
  try {
    console.log('🔄 Running Kitchen Service migrations...');

    // Create orders table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS kitchen_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(255) NOT NULL UNIQUE,
        table_number VARCHAR(50),
        status ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
        items JSON,
        priority INT DEFAULT 0,
        estimated_time INT,
        chef_id INT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_order_id (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create chefs table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS chefs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        specialization VARCHAR(255),
        status ENUM('available', 'busy', 'offline') DEFAULT 'available',
        current_orders INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Insert sample chefs
    await db.execute(`
      INSERT IGNORE INTO chefs (id, name, specialization, status) VALUES
      (1, 'Chef Budi', 'Main Course', 'available'),
      (2, 'Chef Sari', 'Appetizer & Dessert', 'available'),
      (3, 'Chef Andi', 'Grill & BBQ', 'available');
    `);

    console.log('✅ Kitchen Service migrations completed');
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








