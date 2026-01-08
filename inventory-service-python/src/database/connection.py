import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    """Get MySQL database connection"""
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER", "inventory_user"),
        password=os.getenv("DB_PASSWORD", "inventory_pass"),
        database=os.getenv("DB_NAME", "inventory_db"),
        autocommit=False
    )








