import json
from typing import List, Optional, Any
from app.database.connection import get_db_connection
from app.models.schemas import Table, ProjectSchema

def create_table(project_id: int, name: str, schema: Optional[dict] = None, description: Optional[str] = None) -> Table:
    conn = get_db_connection()
    cur = conn.cursor()
    
    schema_json = None
    if schema:
        from fastapi.encoders import jsonable_encoder
        try:
            schema_json = json.dumps(jsonable_encoder(schema))
        except TypeError:
            # Fallback for non-serializable objects
            schema_json = json.dumps(jsonable_encoder(schema), default=str)
        
    if conn.row_factory: # SQLite
        cur.execute("""
            INSERT INTO tables (project_id, name, description, schema)
            VALUES (?, ?, ?, ?)
            RETURNING id, project_id, name, description, schema, created_at, updated_at
        """, (project_id, name, description, schema_json))
    else: # PostgreSQL
        cur.execute("""
            INSERT INTO tables (project_id, name, description, schema)
            VALUES (%s, %s, %s, %s)
            RETURNING id, project_id, name, description, schema, created_at, updated_at
        """, (project_id, name, description, schema_json))
        
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    if row:
        table_dict = dict(row)
        if isinstance(table_dict.get('schema'), str):
            try:
                table_dict['schema'] = json.loads(table_dict['schema'])
            except:
                pass
        return Table(**table_dict)
    raise Exception("创建表格失败")

def get_tables_by_project(project_id: int) -> List[Table]:
    conn = get_db_connection()
    cur = conn.cursor()
    
    if conn.row_factory:
        cur.execute("SELECT * FROM tables WHERE project_id = ?", (project_id,))
    else:
        cur.execute("SELECT * FROM tables WHERE project_id = %s", (project_id,))
        
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    tables = []
    for row in rows:
        table_dict = dict(row)
        if isinstance(table_dict.get('schema'), str):
            try:
                schema_data = json.loads(table_dict['schema'])
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
                
                table_dict['schema'] = schema_data
            except Exception as e:
                pass
        tables.append(Table(**table_dict))
    return tables

def get_table(table_id: int) -> Optional[Table]:
    conn = get_db_connection()
    cur = conn.cursor()
    
    if conn.row_factory:
        cur.execute("SELECT * FROM tables WHERE id = ?", (table_id,))
    else:
        cur.execute("SELECT * FROM tables WHERE id = %s", (table_id,))
        
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if row:
        table_dict = dict(row)
        if isinstance(table_dict.get('schema'), str):
            try:
                schema_data = json.loads(table_dict['schema'])
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
                            
                table_dict['schema'] = schema_data
            except:
                pass
        return Table(**table_dict)
    return None

def ensure_project_geocode_table(project_id: int) -> int:
    """
    确保项目有本地地理数据表，如果不存在则创建
    返回表ID
    """
    # 检查是否已存在
    tables = get_tables_by_project(project_id)
    for table in tables:
        if table.name == '_geocodes':
            print(f"[ensure_project_geocode_table] 项目 {project_id} 已有地理数据表 (ID: {table.id})")
            return table.id
    
    # 创建新表
    schema = {
        "fields": [
            {"key": "address", "label": "地址", "type": "text", "is_primary": True},
            {"key": "lat", "label": "纬度", "type": "number"},
            {"key": "lng", "label": "经度", "type": "number"},
            {"key": "confidence", "label": "置信度", "type": "number"},
            {"key": "source", "label": "来源", "type": "text"},
            {"key": "display_name", "label": "完整地址", "type": "text"},
            {"key": "is_custom", "label": "用户自定义", "type": "text"}
        ]
    }
    new_table = create_table(project_id, "_geocodes", schema, "项目地理数据（可自定义）")
    print(f"[ensure_project_geocode_table] 为项目 {project_id} 创建地理数据表 (ID: {new_table.id})")
    return new_table.id
