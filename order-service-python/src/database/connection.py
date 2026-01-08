import os
import aiomysql
from aiomysql import DictCursor
from dotenv import load_dotenv

load_dotenv()

pool = None

async def init_db():
    """Initialize MySQL connection pool"""
    global pool
    pool = await aiomysql.create_pool(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER", "order_user"),
        password=os.getenv("DB_PASSWORD", "order_pass"),
        db=os.getenv("DB_NAME", "order_db"),
        minsize=1,
        maxsize=10,
        autocommit=False,
        cursorclass=DictCursor
    )
    # Test connection
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT 1")
    return pool

def get_db():
    """Get database pool instance"""
    return pool

async def close_db():
    """Close database pool"""
    global pool
    if pool:
        pool.close()
        await pool.wait_closed()
