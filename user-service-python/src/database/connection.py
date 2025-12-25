import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    """Get MySQL database connection"""
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER", "user_user"),
        password=os.getenv("DB_PASSWORD", "user_pass"),
        database=os.getenv("DB_NAME", "user_db"),
        autocommit=False
    )








