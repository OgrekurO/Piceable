from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.schemas import Project, ProjectCreate, Table, TableCreate
from app.crud.projects import get_projects_from_db, get_project_from_db, create_project_in_db, delete_project_from_db
from app.crud.tables import create_table, get_tables_by_project, get_table
from app.api.dependencies import get_current_active_user
from app.models.schemas import User

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("/", response_model=List[Project])
async def get_projects(current_user: User = Depends(get_current_active_user)):
    projects = get_projects_from_db(current_user.id)
    # Populate tables for each project
    for project in projects:
        project.tables = get_tables_by_project(project.id)
    return projects

@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: int, current_user: User = Depends(get_current_active_user)):
    project = get_project_from_db(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="项目未找到")
    project.tables = get_tables_by_project(project.id)
    return project

@router.post("/", response_model=Project)
async def create_project(project: ProjectCreate, current_user: User = Depends(get_current_active_user)):
    try:
        created_project = create_project_in_db(
            name=project.name, 
            user_id=current_user.id,
            description=project.description,
            source_type=project.source_type or "manual",
            source_metadata=project.source_metadata
        )
        
        # Create default table
        create_table(created_project.id, created_project.name, project.table_schema, "默认数据表")
        
        created_project.tables = get_tables_by_project(created_project.id)
        return created_project
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建项目失败: {str(e)}")

@router.delete("/{project_id}")
async def delete_project(project_id: int, current_user: User = Depends(get_current_active_user)):
    try:
        success = delete_project_from_db(project_id, current_user.id)
        if not success:
            raise HTTPException(status_code=404, detail="项目未找到")
        return {"message": "项目删除成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除项目失败: {str(e)}")

@router.get("/{project_id}/tables", response_model=List[Table])
async def get_project_tables(project_id: int, current_user: User = Depends(get_current_active_user)):
    # Check if project exists and belongs to user
    project = get_project_from_db(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="项目未找到")
    
    tables = get_tables_by_project(project_id)
    return tables

@router.post("/{project_id}/tables", response_model=Table)
async def create_project_table(project_id: int, table: TableCreate, current_user: User = Depends(get_current_active_user)):
    # Check if project exists and belongs to user
    project = get_project_from_db(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="项目未找到")
        
    try:
        # 手动构造纯字典,避免任何序列化问题
        schema_dict = None
        
        # 如果是关系表,且没有提供schema,或者想强制使用默认schema
        if table.name.lower() in ['relationships', '关系'] and not table.schema_def:
            schema_dict = {
                "fields": [
                    {"key": "From", "label": "源节点", "type": "text", "is_primary": True},
                    {"key": "To", "label": "目标节点", "type": "text"},
                    {"key": "Direction", "label": "方向", "type": "select", "options": ["directed", "undirected"]},
                    {"key": "Label", "label": "标签", "type": "text"},
                    {"key": "Type", "label": "类型", "type": "text"},
                    {"key": "Tags", "label": "标签", "type": "multi_select"},
                    {"key": "Description", "label": "描述", "type": "text"},
                    {"key": "Image", "label": "图片", "type": "image"}
                ],
                "view_settings": {}
            }
        elif table.schema_def:
            fields_list = []
            for f in table.schema_def.fields:
                field_dict = {
                    "key": f.key,
                    "label": f.label,
                    "type": f.type.value if hasattr(f.type, "value") else str(f.type),
                    "is_primary": f.is_primary,
                    "options": f.options,
                    "related_target": f.related_target
                }
                fields_list.append(field_dict)
            
            schema_dict = {
                "fields": fields_list,
                "view_settings": table.schema_def.view_settings
            }
            
        new_table = create_table(project_id, table.name, schema_dict, table.description)
        return new_table
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建表格失败: {str(e)}")