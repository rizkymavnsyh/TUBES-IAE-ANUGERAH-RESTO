import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.connection import get_db_connection

def migrate():
    """Run database migrations"""
    try:
        print("🔄 Running Kitchen Service (Python) migrations...")
        conn = get_db_connection()
        cursor = conn.cursor()

        # Create kitchen_orders table
        cursor.execute("""
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
        """)

        # Create chefs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chefs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                specialization VARCHAR(255),
                status ENUM('available', 'busy', 'offline') DEFAULT 'available',
                current_orders INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # Insert sample chefs
        cursor.execute("""
            INSERT IGNORE INTO chefs (id, name, specialization, status) VALUES
            (1, 'Chef Budi', 'Main Course', 'available'),
            (2, 'Chef Sari', 'Appetizer & Dessert', 'available'),
            (3, 'Chef Andi', 'Grill & BBQ', 'available');
        """)

        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Kitchen Service (Python) migrations completed")
    except Exception as error:
        print(f"❌ Migration error: {error}")
        sys.exit(1)

if __name__ == "__main__":
    migrate()



