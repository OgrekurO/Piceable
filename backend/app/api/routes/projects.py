from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.schemas import Project, ProjectCreate, Table, TableCreate
from app.crud.projects import get_projects_from_db, get_project_from_db, create_project_in_db, delete_project_from_db
from app.crud.tables import create_table, get_tables_by_project, get_table
from app.api.dependencies import get_current_active_user
from app.models.schemas import User
from pydantic import BaseModel
from app.services.geocoding_service import GeocodingService
from app.database.session import get_db
from sqlalchemy.orm import Session

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

# ========== 地理编码相关 API ==========

from fastapi import BackgroundTasks

class GeocodeRequest(BaseModel):
    """地理编码请求"""
    addresses: List[str]
    field_name: str  # 地址字段名称
    background: bool = False  # 是否后台处理
    copy_to_project: bool = True  # 是否复制到项目本地表（默认复制）

class GeocodeResponse(BaseModel):
    """地理编码响应"""
    results: dict  # 地址 -> 坐标映射
    failed: List[str]  # 失败的地址列表
    cached_count: int  # 缓存命中数量
    new_count: int  # 新编码数量
    message: str = "Success"  # 状态消息

async def process_geocoding_background(
    project_id: int,
    addresses: List[str],
    use_project_cache: bool
):
    """后台处理地理编码"""
    try:
        print(f"[Background] 开始后台地理编码 {len(addresses)} 个地址...")
        # 注意：后台任务中无法使用依赖注入的 db，需要创建新的连接
        from app.database.connection import get_db_connection
        
        # 创建 GeocodingService（使用项目缓存或全局缓存）
        cache_project_id = project_id if use_project_cache else None
        service = GeocodingService(db=None, project_id=cache_project_id)
        
        await service.batch_geocode(addresses)
        print(f"[Background] 后台地理编码完成")
    except Exception as e:
        print(f"[Background] 后台地理编码失败: {str(e)}")

@router.post("/{project_id}/geocode", response_model=GeocodeResponse)
async def geocode_addresses(
    project_id: int,
    request: GeocodeRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user)
):
    """
    批量地理编码
    
    Args:
        project_id: 项目ID
        request: 包含地址列表和字段名的请求
        
    Returns:
        地理编码结果,包括成功和失败的地址
    """
    # 检查项目权限
    project = get_project_from_db(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="项目未找到")
    
    # 创建地理编码服务（始终使用全局缓存）
    geocoding_service = GeocodingService(db=None)
    
    # 去重地址列表
    unique_addresses = list(set(filter(None, request.addresses)))
    
    # 如果请求后台处理
    if request.background:
        # TODO: 更新后台任务以使用新方法
        background_tasks.add_task(
            process_geocoding_background,
            project_id,
            unique_addresses,
            False  # 不再使用项目缓存参数
        )
        return GeocodeResponse(
            results={},
            failed=[],
            cached_count=0,
            new_count=0,
            message=f"已启动后台处理，共 {len(unique_addresses)} 个地址"
        )
    
    # 同步处理
    try:
        if request.copy_to_project:
            # 使用新方法：地理编码 + 复制到项目本地
            result = await geocoding_service.geocode_and_copy_to_project(
                addresses=unique_addresses,
                target_project_id=project_id,
                field_name=request.field_name
            )
            
            return GeocodeResponse(
                results=result["results"],
                failed=result["failed"],
                cached_count=result["cached_count"],
                new_count=result["new_count"],
                message=f"已复制 {result['copied_count']} 条数据到项目本地表"
            )
        else:
            # 仅地理编码，不复制
            geocode_results = await geocoding_service.batch_geocode(unique_addresses)
            
            cached_count = sum(1 for r in geocode_results.values() if r and r.get('cached'))
            new_count = len([r for r in geocode_results.values() if r]) - cached_count
            failed = [addr for addr, r in geocode_results.items() if not r]
            
            return GeocodeResponse(
                results=geocode_results,
                failed=failed,
                cached_count=cached_count,
                new_count=new_count
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"地理编码失败: {str(e)}")