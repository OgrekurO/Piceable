import sqlite3
import json
from typing import List, Optional
from datetime import datetime
from app.database.connection import get_db_connection
from app.models.schemas import Item

def get_all_items_from_db(user_id: int = 1) -> List[Item]:
    """
    从数据库获取所有项目，按用户ID过滤
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 检查数据库类型
    if conn.row_factory:  # SQLite
        cur.execute("SELECT id, data, created_at, updated_at FROM items WHERE user_id = ?", (user_id,))
    else:  # PostgreSQL
        cur.execute("SELECT id, data, created_at, updated_at FROM items WHERE user_id = %s", (user_id,))
    
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    items = []
    for row in rows:
        item_dict = dict(row)
        # 解析JSON数据
        if isinstance(item_dict['data'], str):
            item_dict['data'] = json.loads(item_dict['data'])
        items.append(Item(**item_dict))
    
    return items

def get_item_from_db(item_id: str, user_id: int = 1) -> Optional[Item]:
    """
    从数据库获取单个项目，按用户ID过滤
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 检查数据库类型
    if conn.row_factory:  # SQLite
        cur.execute("SELECT id, data, created_at, updated_at FROM items WHERE id = ? AND user_id = ?", (item_id, user_id))
    else:  # PostgreSQL
        cur.execute("SELECT id, data, created_at, updated_at FROM items WHERE id = %s AND user_id = %s", (item_id, user_id))
    
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if row:
        item_dict = dict(row)
        # 解析JSON数据
        if isinstance(item_dict['data'], str):
            item_dict['data'] = json.loads(item_dict['data'])
        return Item(**item_dict)
    
    return None

def save_items_to_db(items: List[dict], user_id: int = 1, project_id: Optional[int] = None):
    """
    保存项目到数据库
    items: 动态数据项列表，每项是一个字典
    """
    if not items:
        return
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # 检查数据库类型
        if conn.row_factory:  # SQLite
            # 使用事务确保数据一致性
            cur.execute("BEGIN")
            
            # 批量插入新数据
            now = datetime.now().isoformat()
            data = [
                (
                    item.get('id', f"item_{i}"),  # 如果没有id，生成一个
                    json.dumps(item),  # 将整个item存储为JSON
                    now,
                    now,
                    user_id,
                    project_id
                )
                for i, item in enumerate(items)
            ]
            
            cur.executemany("""
                INSERT OR REPLACE INTO items (id, data, created_at, updated_at, user_id, project_id)
                VALUES (?, ?, ?, ?, ?, ?)
            """, data)
            
            # 提交事务
            cur.execute("COMMIT")
        else:  # PostgreSQL
            # 使用事务确保数据一致性
            cur.execute("BEGIN")
            
            # 批量插入新数据
            now = datetime.now()
            data = [
                (
                    item.get('id', f"item_{i}"),
                    json.dumps(item),
                    now,
                    now,
                    user_id,
                    project_id
                )
                for i, item in enumerate(items)
            ]
            
            cur.executemany("""
                INSERT INTO items (id, data, created_at, updated_at, user_id, project_id)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    data = EXCLUDED.data,
                    updated_at = EXCLUDED.updated_at
            """, data)
            
            # 提交事务
            cur.execute("COMMIT")
        
        print(f"成功保存 {len(items)} 个项目到数据库")
    except Exception as e:
        # 发生错误时回滚
        cur.execute("ROLLBACK")
        print(f"保存项目时发生错误: {e}")
        raise
    finally:
        cur.close()
        conn.close()