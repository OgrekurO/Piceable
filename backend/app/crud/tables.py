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
