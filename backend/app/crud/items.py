import json
from app.database.connection import get_db_connection
from app.models.schemas import Item, LibraryInfo

def get_all_items_from_db():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 检查数据库类型
    if conn.row_factory:  # SQLite
        cur.execute("SELECT * FROM items")
    else:  # PostgreSQL
        cur.execute("SELECT * FROM items")
    
    items_rows = cur.fetchall()
    cur.close()
    conn.close()
    
    items = []
    for row in items_rows:
        row_dict = dict(row)
        # 处理JSON字段
        if isinstance(row_dict.get('folders'), str):
            row_dict['folders'] = json.loads(row_dict['folders'])
        if isinstance(row_dict.get('tags'), str):
            row_dict['tags'] = json.loads(row_dict['tags'])
        items.append(Item(**row_dict))
    
    return items

def get_item_from_db(item_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 检查数据库类型
    if conn.row_factory:  # SQLite
        cur.execute("SELECT * FROM items WHERE id = ?", (item_id,))
    else:  # PostgreSQL
        cur.execute("SELECT * FROM items WHERE id = %s", (item_id,))
    
    item_row = cur.fetchone()
    cur.close()
    conn.close()
    
    if item_row:
        row_dict = dict(item_row)
        # 处理JSON字段
        if isinstance(row_dict.get('folders'), str):
            row_dict['folders'] = json.loads(row_dict['folders'])
        if isinstance(row_dict.get('tags'), str):
            row_dict['tags'] = json.loads(row_dict['tags'])
        return Item(**row_dict)

def get_library_info_from_db():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 检查数据库类型
    if conn.row_factory:  # SQLite
        cur.execute("SELECT * FROM library_info LIMIT 1")
    else:  # PostgreSQL
        cur.execute("SELECT * FROM library_info LIMIT 1")
    
    info_row = cur.fetchone()
    cur.close()
    conn.close()
    
    if info_row:
        return LibraryInfo(**dict(info_row))

def update_library_items_count(count: int):
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 检查数据库类型
    if conn.row_factory:  # SQLite
        cur.execute("UPDATE library_info SET itemsCount = ?", (count,))
    else:  # PostgreSQL
        cur.execute("UPDATE library_info SET itemsCount = %s", (count,))
    
    conn.commit()
    cur.close()
    conn.close()