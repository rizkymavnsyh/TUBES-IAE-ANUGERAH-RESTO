import asyncio
import aiomysql
import os
from dotenv import load_dotenv

load_dotenv()

async def update_payment_enum():
    """Update payment_method ENUM to include qris and transfer"""
    try:
        print("🔄 Updating payment_method ENUM...")
        
        conn = await aiomysql.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER", "order_user"),
            password=os.getenv("DB_PASSWORD", "order_pass"),
            db=os.getenv("DB_NAME", "order_db")
        )
        
        async with conn.cursor() as cur:
            await cur.execute("""
                ALTER TABLE orders 
                MODIFY COLUMN payment_method ENUM('cash', 'card', 'digital_wallet', 'loyalty_points', 'qris', 'transfer') DEFAULT 'cash'
            """)
            await conn.commit()
            print("✅ payment_method ENUM updated successfully!")
        
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")
        # Check if it's because ENUM already has the values
        if "Duplicate" in str(e) or "already exists" in str(e).lower():
            print("ℹ️  ENUM might already be updated")
        else:
            raise

if __name__ == "__main__":
    asyncio.run(update_payment_enum())


