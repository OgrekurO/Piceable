import sqlite3
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys
import os
from app.config import DATABASE_URL
from app.auth.security import get_password_hash

def init_db():
    if DATABASE_URL.startswith("sqlite"):
        # 使用SQLite数据库
        db_path = DATABASE_URL.replace("sqlite:///", "")
        # 确保db目录存在
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        # 连接到SQLite数据库
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        
        # 创建用户表
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT NOT NULL,
                hashed_password TEXT NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                role_id INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("用户表创建成功！")
        
        # 检查是否已存在管理员用户
        cur.execute("SELECT * FROM users WHERE username = ?", ("admin",))
        if cur.fetchone() is None:
            # 插入默认管理员用户 (密码为 "admin")
            hashed_password = get_password_hash("admin")
            cur.execute("""
                INSERT INTO users (username, email, hashed_password, is_active, role_id)
                VALUES (?, ?, ?, ?, ?)
            """, ("admin", "admin@example.com", hashed_password, 1, 1))
            print("默认管理员用户创建成功！")
        else:
            print("默认管理员用户已存在。")
            
        # 创建项目表 (SQLite)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS items (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                folders TEXT DEFAULT '[]',
                tags TEXT DEFAULT '[]',
                annotation TEXT,
                url TEXT,
                lastModified INTEGER,
                thumbnail TEXT
            )
        """)
        
        # 创建库信息表 (SQLite)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS library_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                path TEXT NOT NULL,
                itemsCount INTEGER DEFAULT 0,
                version TEXT
            )
        """)
        
        # 插入默认管理员用户（如果不存在）
        cur.execute("SELECT * FROM users WHERE username = ?", ("admin",))
        if cur.fetchone() is None:
            hashed_password = get_password_hash("admin")
            cur.execute("""
                INSERT INTO users (username, email, hashed_password, is_active, role_id)
                VALUES (?, ?, ?, ?, ?)
            """, ("admin", "admin@example.com", hashed_password, 1, 1))
        
        # 插入库信息（如果不存在）
        cur.execute("SELECT * FROM library_info LIMIT 1")
        if cur.fetchone() is None:
            cur.execute("""
                INSERT INTO library_info (name, path, itemsCount, version)
                VALUES (?, ?, ?, ?)
            """, ("示例库", "/path/to/library", 0, "1.0.0"))
            
        # 提交更改
        conn.commit()
        
        # 关闭游标和连接
        cur.close()
        conn.close()
        
        print("SQLite数据库初始化完成！")
        
    else:
        # 使用PostgreSQL数据库（原有逻辑）
        # 连接到PostgreSQL服务器
        conn = psycopg2.connect(
            host="localhost",
            database="postgres",
            user="postgres", 
            password="postgres"
        )

        # 设置自动提交
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)

        # 创建游标
        cur = conn.cursor()

        # 创建数据库
        try:
            cur.execute("CREATE DATABASE eagle_ontology_db;")
            print("数据库 'eagle_ontology_db' 创建成功！")
        except psycopg2.errors.DuplicateDatabase:
            print("数据库 'eagle_ontology_db' 已存在。")

        # 关闭游标和连接
        cur.close()
        conn.close()

        # 连接到新创建的数据库
        conn = psycopg2.connect(
            host="localhost",
            database="eagle_ontology_db",
            user="postgres",
            password="postgres"
        )

        # 创建游标
        cur = conn.cursor()

        # 检查users表是否已存在
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            );
        """)
        
        table_exists = cur.fetchone()[0]
        
        if not table_exists:
            # 创建用户表
            cur.execute("""
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    hashed_password TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    role_id INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            print("用户表创建成功！")

            # 插入默认管理员用户 (密码为 "admin")
            hashed_password = get_password_hash("admin")
            cur.execute("""
                INSERT INTO users (username, email, hashed_password, is_active, role_id)
                VALUES ('admin', 'admin@example.com', %s, TRUE, 1);
            """, (hashed_password,))
            print("默认管理员用户创建成功！")
        else:
            print("用户表已存在。")

        # 创建项目表 (PostgreSQL)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS items (
                id VARCHAR(50) PRIMARY KEY,
                name TEXT NOT NULL,
                folders JSONB DEFAULT '[]',
                tags JSONB DEFAULT '[]',
                annotation TEXT,
                url TEXT,
                lastModified BIGINT,
                thumbnail TEXT
            )
        """)
        
        # 创建库信息表 (PostgreSQL)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS library_info (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                path TEXT NOT NULL,
                itemsCount INTEGER DEFAULT 0,
                version TEXT
            )
        """)
        
        # 插入库信息（如果不存在）
        cur.execute("SELECT * FROM library_info LIMIT 1")
        if cur.fetchone() is None:
            cur.execute("""
                INSERT INTO library_info (name, path, itemsCount, version)
                VALUES (%s, %s, %s, %s)
            """, ("示例库", "/path/to/library", 0, "1.0.0"))

        # 提交更改
        conn.commit()

        # 关闭游标和连接
        cur.close()
        conn.close()

        print("PostgreSQL数据库初始化完成！")
    
def init_db_wrapper():
    try:
        init_db()
    except psycopg2.OperationalError as e:
        print(f"数据库连接错误: {e}")
        print("请确保：")
        print("1. PostgreSQL服务正在运行")
        print("2. 用户名和密码正确")
        print("3. PostgreSQL已正确安装和配置")
        sys.exit(1)
    except Exception as e:
        print(f"发生错误: {e}")
        sys.exit(1)