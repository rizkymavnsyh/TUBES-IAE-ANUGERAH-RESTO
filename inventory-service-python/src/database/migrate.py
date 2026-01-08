import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.connection import get_db_connection

def migrate():
    """Run database migrations"""
    try:
        print("🔄 Running Inventory Service (Python) migrations...")
        conn = get_db_connection()
        cursor = conn.cursor()

        # Create suppliers table
        cursor.execute("""
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
        """)

        # Create ingredients table
        cursor.execute("""
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
        """)

        # Create stock_movements table
        cursor.execute("""
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
        """)

        # Create purchase_orders table
        cursor.execute("""
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
        """)

        # Create purchase_order_items table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS purchase_order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                purchase_order_id INT NOT NULL,
                ingredient_id INT NOT NULL,
                quantity DECIMAL(10, 2) NOT NULL,
                unit_price DECIMAL(10, 2) NOT NULL,
                total_price DECIMAL(10, 2) NOT NULL,
                received_quantity DECIMAL(10, 2) DEFAULT 0,
                FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
                FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # Insert sample suppliers
        cursor.execute("""
            INSERT IGNORE INTO suppliers (id, name, contact_person, email, phone, address) VALUES
            (1, 'PT Bahan Baku Sejahtera', 'Budi Santoso', 'budi@bahanbaku.com', '081234567890', 'Jl. Raya Jakarta No. 123'),
            (2, 'CV Supplier Makmur', 'Siti Nurhaliza', 'siti@makmur.com', '081234567891', 'Jl. Bandung Raya No. 456'),
            (3, 'UD Segar Abadi', 'Ahmad Yani', 'ahmad@segar.com', '081234567892', 'Jl. Surabaya No. 789');
        """)

        # Insert sample ingredients
        cursor.execute("""
            INSERT IGNORE INTO ingredients (id, name, unit, category, min_stock_level, current_stock, supplier_id, cost_per_unit) VALUES
            (1, 'Beras', 'kg', 'Staple', 50, 100, 1, 12000),
            (2, 'Ayam', 'kg', 'Protein', 20, 30, 2, 35000),
            (3, 'Ikan', 'kg', 'Protein', 15, 25, 2, 40000),
            (4, 'Sayuran Mix', 'kg', 'Vegetable', 10, 20, 3, 15000),
            (5, 'Bumbu Dasar', 'pack', 'Spice', 20, 50, 1, 5000),
            (6, 'Minyak Goreng', 'liter', 'Cooking', 30, 60, 1, 18000),
            (7, 'Telur', 'butir', 'Protein', 100, 200, 2, 2000),
            (8, 'Tahu', 'potong', 'Protein', 50, 100, 3, 3000);
        """)

        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Inventory Service (Python) migrations completed")
    except Exception as error:
        print(f"❌ Migration error: {error}")
        sys.exit(1)

if __name__ == "__main__":
    migrate()



