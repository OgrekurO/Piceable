import sqlite3
import json
from typing import List, Optional, Any
from app.database.connection import get_db_connection
from app.models.schemas import Project

def get_projects_from_db(user_id: int) -> List[Project]:
    """
    从数据库获取用户的所有项目，包括系统项目（ID=0）
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 检查数据库类型
    # 使用 UNION 同时获取用户项目和系统项目
    if conn.row_factory:  # SQLite
        cur.execute("""
            SELECT id, name, description, source_type, source_metadata, schema, created_at, last_modified, user_id, items_count 
            FROM projects 
            WHERE user_id = ? OR id = 0
            ORDER BY id
        """, (user_id,))
    else:  # PostgreSQL
        cur.execute("""
            SELECT id, name, description, source_type, source_metadata, schema, created_at, last_modified, user_id, items_count 
            FROM projects 
            WHERE user_id = %s OR id = 0
            ORDER BY id
        """, (user_id,))
    
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    projects = []
    for row in rows:
        project_dict = dict(row)
        # 处理JSON字段
        if isinstance(project_dict.get('source_metadata'), str):
             try:
                project_dict['source_metadata'] = json.loads(project_dict['source_metadata'])
             except:
                pass # Keep as string if not valid JSON
        if isinstance(project_dict.get('schema'), str):
             try:
                schema_data = json.loads(project_dict['schema'])
                # Adapter for legacy schema format (columns -> fields)
                if isinstance(schema_data, dict) and 'columns' in schema_data and 'fields' not in schema_data:
                    schema_data['fields'] = schema_data['columns']
                    # Ensure field structure matches FieldDefinition
                    for field in schema_data['fields']:
                        if 'name' in field and 'key' not in field:
                            field['key'] = field['name']
                        # Add label field (required by FieldDefinition)
                        if 'name' in field and 'label' not in field:
                            field['label'] = field['name']
                
                project_dict['schema'] = schema_data
             except:
                pass
        projects.append(Project(**project_dict))
    
    return projects

def get_project_from_db(project_id: int, user_id: int) -> Optional[Project]:
    """
    从数据库获取单个项目
    特殊处理：当 project_id=0（系统项目）时，不过滤 user_id，允许所有用户查看
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 如果是系统项目（project_id=0），不过滤 user_id
    if project_id == 0:
        if conn.row_factory:  # SQLite
            cur.execute("SELECT id, name, description, source_type, source_metadata, schema, created_at, last_modified, user_id, items_count FROM projects WHERE id = ?", (project_id,))
        else:  # PostgreSQL
            cur.execute("SELECT id, name, description, source_type, source_metadata, schema, created_at, last_modified, user_id, items_count FROM projects WHERE id = %s", (project_id,))
    else:
        # 检查数据库类型
        if conn.row_factory:  # SQLite
            cur.execute("SELECT id, name, description, source_type, source_metadata, schema, created_at, last_modified, user_id, items_count FROM projects WHERE id = ? AND user_id = ?", (project_id, user_id))
        else:  # PostgreSQL
            cur.execute("SELECT id, name, description, source_type, source_metadata, schema, created_at, last_modified, user_id, items_count FROM projects WHERE id = %s AND user_id = %s", (project_id, user_id))
    
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if row:
        project_dict = dict(row)
        # 处理JSON字段
        if isinstance(project_dict.get('source_metadata'), str):
             try:
                project_dict['source_metadata'] = json.loads(project_dict['source_metadata'])
             except Exception as e:
                print(f"Error parsing source_metadata: {e}")
                pass
        if isinstance(project_dict.get('schema'), str):
             try:
                schema_data = json.loads(project_dict['schema'])
                # Adapter for legacy schema format (columns -> fields)
                if isinstance(schema_data, dict) and 'columns' in schema_data and 'fields' not in schema_data:
                    schema_data['fields'] = schema_data['columns']
                    # Ensure field structure matches FieldDefinition
                    for field in schema_data['fields']:
                        if 'name' in field and 'key' not in field:
                            field['key'] = field['name']
                        # Add label field (required by FieldDefinition)
                        if 'name' in field and 'label' not in field:
                            field['label'] = field['name']
                        if 'type' in field:
                            # Map legacy types if needed
                            pass
                
                project_dict['schema'] = schema_data
             except Exception as e:
                print(f"Error parsing schema: {e}")
                pass
        try:
            return Project(**project_dict)
        except Exception as e:
            print(f"Error creating Project model: {e}")
            print(f"Project dict: {project_dict}")
            raise e
    return None

def create_project_in_db(name: str, user_id: int, description: Optional[str] = None, source_type: str = "manual", source_metadata: Optional[Any] = None, schema: Optional[dict] = None) -> Project:
    """
    创建新项目
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 准备 source_metadata 和 schema
    source_metadata_json = None
    if source_metadata:
        source_metadata_json = json.dumps(source_metadata)
    
    schema_json = None
    if schema:
        schema_json = json.dumps(schema)
    
    # 检查数据库类型
    if conn.row_factory:  # SQLite
        cur.execute("""
            INSERT INTO projects (name, description, source_type, source_metadata, schema, user_id)
            VALUES (?, ?, ?, ?, ?, ?)
            RETURNING id, name, description, source_type, source_metadata, schema, created_at, last_modified, user_id, items_count
        """, (name, description, source_type, source_metadata_json, schema_json, user_id))
    else:  # PostgreSQL
        cur.execute("""
            INSERT INTO projects (name, description, source_type, source_metadata, schema, user_id)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, name, description, source_type, source_metadata, schema, created_at, last_modified, user_id, items_count
        """, (name, description, source_type, source_metadata_json, schema_json, user_id))
    
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    if row:
        project_dict = dict(row)
        # 处理JSON字段
        if isinstance(project_dict.get('source_metadata'), str):
             try:
                project_dict['source_metadata'] = json.loads(project_dict['source_metadata'])
             except:
                pass
        if isinstance(project_dict.get('schema'), str):
             try:
                schema_data = json.loads(project_dict['schema'])
                # Adapter for legacy schema format (columns -> fields)
                if isinstance(schema_data, dict) and 'columns' in schema_data and 'fields' not in schema_data:
                    schema_data['fields'] = schema_data['columns']
                    # Ensure field structure matches FieldDefinition
                    for field in schema_data['fields']:
                        if 'name' in field and 'key' not in field:
                            field['key'] = field['name']
                        # Add label field (required by FieldDefinition)
                        if 'name' in field and 'label' not in field:
                            field['label'] = field['name']
                
                project_dict['schema'] = schema_data
             except:
                pass
        return Project(**project_dict)
    raise Exception("创建项目失败")

def update_project_last_modified(project_id: int, user_id: int):
    """
    更新项目的最后修改时间
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 检查数据库类型
    if conn.row_factory:  # SQLite
        cur.execute("UPDATE projects SET last_modified = datetime('now') WHERE id = ? AND user_id = ?", (project_id, user_id))
    else:  # PostgreSQL
        cur.execute("UPDATE projects SET last_modified = NOW() WHERE id = %s AND user_id = %s", (project_id, user_id))
    
    conn.commit()
    cur.close()
    conn.close()

def update_project_items_count(project_id: int, user_id: int, count: int):
    """
    更新项目的项数
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 检查数据库类型
    if conn.row_factory:  # SQLite
        cur.execute("UPDATE projects SET items_count = ? WHERE id = ? AND user_id = ?", (count, project_id, user_id))
    else:  # PostgreSQL
        cur.execute("UPDATE projects SET items_count = %s WHERE id = %s AND user_id = %s", (count, project_id, user_id))
    
    conn.commit()
    cur.close()
    conn.close()

def delete_project_from_db(project_id: int, user_id: int) -> bool:
    """
    删除项目
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 检查数据库类型
    if conn.row_factory:  # SQLite
        cur.execute("DELETE FROM projects WHERE id = ? AND user_id = ?", (project_id, user_id))
    else:  # PostgreSQL
        cur.execute("DELETE FROM projects WHERE id = %s AND user_id = %s", (project_id, user_id))
    
    conn.commit()
    rows_affected = cur.rowcount
    cur.close()
    conn.close()
    
    return rows_affected > 0

def update_project_schema_in_db(project_id: int, user_id: int, schema: dict) -> bool:
    """
    更新项目的 schema
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    schema_json = json.dumps(schema)
    
    # 检查数据库类型
    if conn.row_factory:  # SQLite
        cur.execute("UPDATE projects SET schema = ? WHERE id = ? AND user_id = ?", (schema_json, project_id, user_id))
    else:  # PostgreSQL
        cur.execute("UPDATE projects SET schema = %s WHERE id = %s AND user_id = %s", (schema_json, project_id, user_id))
    
    conn.commit()
    rows_affected = cur.rowcount
    cur.close()
    conn.close()
    
    return rows_affected > 0