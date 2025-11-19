import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
from app.config import DATABASE_URL

def get_db_connection():
    if DATABASE_URL.startswith("sqlite"):
        conn = sqlite3.connect(DATABASE_URL.replace("sqlite:///", ""), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn
    else:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn