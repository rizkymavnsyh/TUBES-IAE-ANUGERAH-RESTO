import sys
import os
import asyncio
import aiomysql
from dotenv import load_dotenv

load_dotenv()

async def migrate():
    """Run database migrations"""
    try:
        print("🔄 Running Order Service (Python) migrations...")
        
        conn = await aiomysql.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER", "order_user"),
            password=os.getenv("DB_PASSWORD", "order_pass"),
            db=os.getenv("DB_NAME", "order_db")
        )
        
        async with conn.cursor() as cur:
            # Create menus table
            await cur.execute("""
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
            """)
            
            # Create carts table
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS carts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    cart_id VARCHAR(255),
                    user_id VARCHAR(255) NOT NULL UNIQUE,
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
                    INDEX idx_user_id (user_id),
                    INDEX idx_customer_id (customer_id),
                    INDEX idx_status (status)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
            
            # Create orders table
            await cur.execute("""
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
                    payment_method ENUM('cash', 'card', 'digital_wallet', 'loyalty_points', 'qris', 'transfer') DEFAULT 'cash',
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
            """)
            
            # Update payment_method ENUM if table already exists
            try:
                await cur.execute("""
                    ALTER TABLE orders 
                    MODIFY COLUMN payment_method ENUM('cash', 'card', 'digital_wallet', 'loyalty_points', 'qris', 'transfer') DEFAULT 'cash'
                """)
                print("✅ Updated payment_method ENUM")
            except Exception as e:
                # Table might not exist or column might already be updated
                if "Unknown column" not in str(e) and "Duplicate column name" not in str(e):
                    print(f"⚠️  Could not update payment_method ENUM: {e}")
        
        conn.close()
        print("✅ Order Service (Python) migrations completed")
        sys.exit(0)
    except Exception as error:
        print(f"❌ Migration error: {error}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(migrate())






