import sqlite3
import json
from typing import List, Optional
from datetime import datetime
from app.database.connection import get_db_connection
from app.models.schemas import Item

def get_all_items_from_db(user_id: int = 1, project_id: Optional[int] = None, table_id: Optional[int] = None) -> List[Item]:
    """
    从数据库获取所有项目，按用户ID过滤，可选按项目ID或表格ID过滤
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    query = "SELECT id, data, created_at, updated_at, project_id, table_id FROM items WHERE user_id = ?"
    params = [user_id]
    
    if project_id is not None:
        query += " AND project_id = ?"
        params.append(project_id)
        
    if table_id is not None:
        query += " AND table_id = ?"
        params.append(table_id)
        
    # 检查数据库类型
    if not conn.row_factory:  # PostgreSQL
        query = query.replace("?", "%s")
    
    cur.execute(query, tuple(params))
    
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
        cur.execute("SELECT id, data, created_at, updated_at, project_id, table_id FROM items WHERE id = ? AND user_id = ?", (item_id, user_id))
    else:  # PostgreSQL
        cur.execute("SELECT id, data, created_at, updated_at, project_id, table_id FROM items WHERE id = %s AND user_id = %s", (item_id, user_id))
    
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

def update_item_in_db(item_id: str, data: dict, user_id: int = 1) -> bool:
    """
    更新数据库中的单个项目
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        now = datetime.now().isoformat()
        
        # 检查数据库类型
        if conn.row_factory:  # SQLite
            cur.execute("""
                UPDATE items 
                SET data = ?, updated_at = ?
                WHERE id = ? AND user_id = ?
            """, (json.dumps(data), now, item_id, user_id))
        else:  # PostgreSQL
            cur.execute("""
                UPDATE items 
                SET data = %s, updated_at = %s
                WHERE id = %s AND user_id = %s
            """, (json.dumps(data), now, item_id, user_id))
        
        conn.commit()
        success = cur.rowcount > 0
        cur.close()
        conn.close()
        return success
    except Exception as e:
        print(f"更新项目时发生错误: {e}")
        conn.rollback()
        cur.close()
        conn.close()
        raise

def save_items_to_db(items: List[dict], user_id: int = 1, project_id: Optional[int] = None, table_id: Optional[int] = None):
    """
    保存多个项目到数据库
    """
    if not items:
        return
        
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # 准备数据
        values = []
        for item in items:
            # 确保有ID
            if 'id' not in item:
                import uuid
                item['id'] = str(uuid.uuid4())
                
            item_id = item['id']
            # 提取data (除去id, created_at, updated_at等元数据)
            data = item.copy()
            if 'id' in data: del data['id']
            if 'created_at' in data: del data['created_at']
            if 'updated_at' in data: del data['updated_at']
            
            # 序列化JSON
            data_json = json.dumps(data)
            
            values.append((item_id, data_json, user_id, project_id, table_id))
        
        # 批量插入
        if conn.row_factory:  # SQLite
            cur.executemany(
                "INSERT OR REPLACE INTO items (id, data, user_id, project_id, table_id) VALUES (?, ?, ?, ?, ?)",
                values
            )
        else:  # PostgreSQL
            cur.executemany(
                "INSERT INTO items (id, data, user_id, project_id, table_id) VALUES (%s, %s, %s, %s, %s) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP",
                values
            )
            
        conn.commit()
        print(f"成功保存 {len(items)} 个项目到数据库")
        return [v[0] for v in values]
    except Exception as e:
        conn.rollback()
        print(f"保存项目时发生错误: {e}")
        raise
    finally:
        cur.close()
        conn.close()