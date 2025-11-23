import sqlite3
import json
import os

DB_PATH = "db/data.db"

def migrate():
    print(f"开始迁移数据库: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    # 1. 创建 tables 表
    print("1. 创建 tables 表...")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        schema TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    );
    """)
    
    # 2. 给 items 表添加 table_id 列
    print("2. 给 items 表添加 table_id 列...")
    try:
        cur.execute("ALTER TABLE items ADD COLUMN table_id INTEGER REFERENCES tables(id) ON DELETE CASCADE;")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("   列 table_id 已存在，跳过。")
        else:
            print(f"   注意: {e}")

    # 3. 迁移现有项目数据
    print("3. 迁移现有项目数据...")
    cur.execute("SELECT * FROM projects")
    projects = cur.fetchall()
    
    for project in projects:
        project_id = project['id']
        project_name = project['name']
        project_schema = project['schema']
        
        print(f"   处理项目: {project_name} (ID: {project_id})")
        
        # 检查是否已经有默认表
        cur.execute("SELECT * FROM tables WHERE project_id = ? AND name = ?", (project_id, project_name))
        existing_table = cur.fetchone()
        
        if existing_table:
            print(f"      默认表已存在 (ID: {existing_table['id']})，跳过创建。")
            table_id = existing_table['id']
        else:
            # 创建默认表
            cur.execute("""
                INSERT INTO tables (project_id, name, description, schema)
                VALUES (?, ?, ?, ?)
            """, (project_id, project_name, "默认数据表", project_schema))
            table_id = cur.lastrowid
            print(f"      创建默认表成功 (ID: {table_id})")
            
        # 更新该项目的 items
        cur.execute("UPDATE items SET table_id = ? WHERE project_id = ? AND table_id IS NULL", (table_id, project_id))
        updated_count = cur.rowcount
        print(f"      已更新 {updated_count} 个数据项的 table_id")
        
    conn.commit()
    conn.close()
    print("迁移完成！")

if __name__ == "__main__":
    migrate()
