const db = require('./connection');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function migrate() {
  try {
    console.log('🔄 Running User Service migrations...');

    // Create staff table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS staff (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(50) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        role ENUM('manager', 'chef', 'waiter', 'cashier', 'admin') NOT NULL,
        department VARCHAR(100),
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        password_hash VARCHAR(255),
        hire_date DATE,
        salary DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_employee_id (employee_id),
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create customers table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        date_of_birth DATE,
        registration_date DATE DEFAULT (CURRENT_DATE),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_customer_id (customer_id),
        INDEX idx_email (email),
        INDEX idx_phone (phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create loyalty_programs table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS loyalty_programs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        points_per_rupiah DECIMAL(10, 4) DEFAULT 0.01,
        min_points_to_redeem INT DEFAULT 100,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create customer_loyalty table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS customer_loyalty (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        loyalty_program_id INT NOT NULL,
        total_points DECIMAL(10, 2) DEFAULT 0,
        redeemed_points DECIMAL(10, 2) DEFAULT 0,
        tier VARCHAR(50) DEFAULT 'bronze',
        join_date DATE DEFAULT (CURRENT_DATE),
        last_activity_date DATE,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (loyalty_program_id) REFERENCES loyalty_programs(id) ON DELETE RESTRICT,
        UNIQUE KEY unique_customer_loyalty (customer_id, loyalty_program_id),
        INDEX idx_customer (customer_id),
        INDEX idx_tier (tier)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create loyalty_transactions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS loyalty_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_loyalty_id INT NOT NULL,
        transaction_type ENUM('earn', 'redeem', 'expire', 'adjustment') NOT NULL,
        points DECIMAL(10, 2) NOT NULL,
        order_id VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_loyalty_id) REFERENCES customer_loyalty(id) ON DELETE CASCADE,
        INDEX idx_customer_loyalty (customer_loyalty_id),
        INDEX idx_transaction_type (transaction_type),
        INDEX idx_order_id (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create refresh_tokens table for JWT refresh tokens
    await db.execute(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        staff_id INT NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        revoked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
        INDEX idx_staff_id (staff_id),
        INDEX idx_token_hash (token_hash),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Insert default loyalty program
    await db.execute(`
      INSERT IGNORE INTO loyalty_programs (id, name, description, points_per_rupiah, min_points_to_redeem) VALUES
      (1, 'Anugerah Rewards', 'Program loyalitas untuk pelanggan setia', 0.01, 100);
    `);

    // Insert sample staff (with admin user)
    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminHashedPassword = await bcrypt.hash('admin123', 10);
    await db.execute(`
      INSERT IGNORE INTO staff (id, employee_id, username, name, email, phone, role, department, password_hash, hire_date, salary) VALUES
      (1, 'EMP001', 'manager', 'Manager Budi', 'manager@anugerah.com', '081234567890', 'manager', 'Management', ?, '2023-01-15', 8000000),
      (2, 'EMP002', 'chef', 'Chef Sari', 'chef@anugerah.com', '081234567891', 'chef', 'Kitchen', ?, '2023-02-01', 6000000),
      (3, 'EMP003', 'waiter', 'Waiter Andi', 'waiter@anugerah.com', '081234567892', 'waiter', 'Service', ?, '2023-03-01', 4000000),
      (4, 'EMP004', 'cashier', 'Cashier Rina', 'cashier@anugerah.com', '081234567893', 'cashier', 'Finance', ?, '2023-03-15', 4500000),
      (5, 'ADMIN001', 'admin', 'Administrator', 'admin@anugerah.com', '081234567899', 'admin', 'IT', ?, '2023-01-01', 10000000),
      (6, 'EMP006', 'chef_budi', 'Chef Budi', 'budi@anugerah.com', '081234567888', 'chef', 'Main Course', ?, '2023-04-01', 6000000),
      (7, 'EMP007', 'chef_agus', 'Chef Agus', 'agus@anugerah.com', '081234567887', 'chef', 'Appetizer', ?, '2023-04-01', 6000000),
      (8, 'EMP008', 'chef_citra', 'Chef Citra', 'citra@anugerah.com', '081234567886', 'chef', 'Dessert', ?, '2023-04-01', 6000000);
    `, [hashedPassword, hashedPassword, hashedPassword, hashedPassword, adminHashedPassword, hashedPassword, hashedPassword, hashedPassword]);

    // Insert sample customers
    await db.execute(`
      INSERT IGNORE INTO customers (id, customer_id, name, email, phone, address, date_of_birth, registration_date) VALUES
      (1, 'CUST001', 'Pak Joko', 'joko@email.com', '081111111111', 'Jl. Merdeka No. 1', '1980-05-15', '2023-01-10'),
      (2, 'CUST002', 'Ibu Siti', 'siti@email.com', '081222222222', 'Jl. Sudirman No. 2', '1985-08-20', '2023-02-15'),
      (3, 'CUST003', 'Mas Agung', 'agung@email.com', '081333333333', 'Jl. Thamrin No. 3', '1990-12-25', '2023-03-01');
    `);

    // Insert sample customer loyalty
    await db.execute(`
      INSERT IGNORE INTO customer_loyalty (id, customer_id, loyalty_program_id, total_points, tier) VALUES
      (1, 1, 1, 500, 'gold'),
      (2, 2, 1, 250, 'silver'),
      (3, 3, 1, 100, 'bronze');
    `);

    console.log('✅ User Service migrations completed');
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








