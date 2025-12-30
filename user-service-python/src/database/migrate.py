import sys
import os
import bcrypt

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

try:
    from src.database.connection import get_db_connection
except ImportError:
    # Fallback for direct execution
    import mysql.connector
    from dotenv import load_dotenv
    load_dotenv()
    
    def get_db_connection():
        return mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER", "user_user"),
            password=os.getenv("DB_PASSWORD", "user_pass"),
            database=os.getenv("DB_NAME", "user_db"),
            autocommit=False
        )

def migrate():
    """Run database migrations"""
    try:
        print("🔄 Running User Service (Python) migrations...")
        conn = get_db_connection()
        cursor = conn.cursor()

        # Create staff table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS staff (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id VARCHAR(50) UNIQUE NOT NULL,
                username VARCHAR(50) UNIQUE NOT NULL,
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
                INDEX idx_username (username),
                INDEX idx_email (email),
                INDEX idx_role (role),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # Create customers table
        cursor.execute("""
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
        """)

        # Create loyalty_programs table
        cursor.execute("""
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
        """)

        # Create customer_loyalty table
        cursor.execute("""
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
        """)

        # Create loyalty_transactions table
        cursor.execute("""
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
        """)

        # Create refresh_tokens table for JWT refresh token support
        cursor.execute("""
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
        """)

        # Insert default loyalty program
        cursor.execute("""
            INSERT IGNORE INTO loyalty_programs (id, name, description, points_per_rupiah, min_points_to_redeem) VALUES
            (1, 'Anugerah Rewards', 'Program loyalitas untuk pelanggan setia', 0.01, 100);
        """)

        # Insert sample staff
        hashed_password = bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute("""
            INSERT IGNORE INTO staff (id, employee_id, username, name, email, phone, role, department, password_hash, hire_date, salary) VALUES
            (1, 'ADMIN001', 'admin', 'Admin Sistem', 'admin@anugerah.com', '081200000000', 'admin', 'IT', %s, '2023-01-01', 10000000),
            (2, 'EMP001', 'budi', 'Manager Budi', 'manager@anugerah.com', '081234567890', 'manager', 'Management', %s, '2023-01-15', 8000000),
            (3, 'EMP002', 'sari', 'Chef Sari', 'chef@anugerah.com', '081234567891', 'chef', 'Kitchen', %s, '2023-02-01', 6000000),
            (4, 'EMP003', 'andi', 'Waiter Andi', 'waiter@anugerah.com', '081234567892', 'waiter', 'Service', %s, '2023-03-01', 4000000),
            (5, 'EMP004', 'rina', 'Cashier Rina', 'cashier@anugerah.com', '081234567893', 'cashier', 'Finance', %s, '2023-03-15', 4500000);
        """, (hashed_password, hashed_password, hashed_password, hashed_password, hashed_password))

        # Insert sample customers
        cursor.execute("""
            INSERT IGNORE INTO customers (id, customer_id, name, email, phone, address, date_of_birth, registration_date) VALUES
            (1, 'CUST001', 'Pak Joko', 'joko@email.com', '081111111111', 'Jl. Merdeka No. 1', '1980-05-15', '2023-01-10'),
            (2, 'CUST002', 'Ibu Siti', 'siti@email.com', '081222222222', 'Jl. Sudirman No. 2', '1985-08-20', '2023-02-15'),
            (3, 'CUST003', 'Mas Agung', 'agung@email.com', '081333333333', 'Jl. Thamrin No. 3', '1990-12-25', '2023-03-01');
        """)

        # Insert sample customer loyalty
        cursor.execute("""
            INSERT IGNORE INTO customer_loyalty (id, customer_id, loyalty_program_id, total_points, tier) VALUES
            (1, 1, 1, 500, 'gold'),
            (2, 2, 1, 250, 'silver'),
            (3, 3, 1, 100, 'bronze');
        """)

        conn.commit()
        cursor.close()
        conn.close()
        print("✅ User Service (Python) migrations completed")
    except Exception as error:
        print(f"❌ Migration error: {error}")
        sys.exit(1)

if __name__ == "__main__":
    migrate()



