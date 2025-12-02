from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.schemas import Item, ProjectUpload, ItemCreate
from app.crud.items import get_all_items_from_db, get_item_from_db, save_items_to_db
from app.crud.projects import create_project_in_db, update_project_items_count, get_project_from_db
from app.api.dependencies import get_current_active_user
from app.models.schemas import User

router = APIRouter(prefix="/api", tags=["items"])

from typing import List, Optional

from app.crud.tables import create_table, get_tables_by_project

@router.get("/items", response_model=List[Item])
async def get_items(projectId: Optional[int] = None, tableId: Optional[int] = None, current_user: User = Depends(get_current_active_user)):
    items = get_all_items_from_db(current_user.id, projectId, tableId)
    return items

@router.get("/item/{item_id}", response_model=Item)
async def get_item(item_id: str, current_user: User = Depends(get_current_active_user)):
    item = get_item_from_db(item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail="项目未找到")
    return item

@router.put("/item/{item_id}")
async def update_item(item_id: str, item_data: dict, current_user: User = Depends(get_current_active_user)):
    from app.crud.items import update_item_in_db
    try:
        success = update_item_in_db(item_id, item_data, current_user.id)
        if not success:
            raise HTTPException(status_code=404, detail="项目未找到或无权限")
        return {"message": "项目更新成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新失败: {str(e)}")

@router.post("/items", response_model=Item)
async def create_item(item: ItemCreate, current_user: User = Depends(get_current_active_user)):
    try:
        # 使用 save_items_to_db 保存单个项目
        # 注意: save_items_to_db 期望一个列表
        items_data = [item.data]
        
        # 确保项目存在
        project = get_project_from_db(item.projectId, current_user.id)
        if not project:
            raise HTTPException(status_code=404, detail="项目未找到")
            
        # 保存数据
        saved_ids = save_items_to_db(items_data, current_user.id, item.projectId, item.tableId)
        
        if not saved_ids:
            raise HTTPException(status_code=500, detail="保存失败")
            
        # 获取保存后的项目
        saved_item = get_item_from_db(saved_ids[0], current_user.id)
        return saved_item
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建失败: {str(e)}")

@router.post("/upload")
async def upload_project(data: ProjectUpload, current_user: User = Depends(get_current_active_user)):
    try:
        print(f"[UPLOAD] 收到上传请求，用户: {current_user.username}")
        print(f"[UPLOAD] 项目名称: {data.projectName}")
        print(f"[UPLOAD] 项目ID: {data.projectId}")
        print(f"[UPLOAD] 表格ID: {data.tableId}")
        print(f"[UPLOAD] 数据项数量: {len(data.items)}")
        print(f"[UPLOAD] Schema: {data.table_schema}")
        
        project_id = data.projectId
        table_id = data.tableId
        
        # 如果没有提供 schema，自动生成一个基础 schema
        schema = data.table_schema
        if not schema and data.items:
            # 从第一个 item 推断 schema
            first_item = data.items[0]
            schema = {
                "fields": [  # 使用 fields 而不是 columns
                    {"key": key, "label": key, "type": infer_type(value)}
                    for key, value in first_item.items()
                ]
            }
            print(f"[UPLOAD] 自动推断的 schema: {schema}")

        if project_id:
            # 验证项目是否存在且属于当前用户
            print(f"[UPLOAD] 使用已有项目ID: {project_id}")
            
            if not table_id:
                # 如果没有提供 tableId，检查是否应该创建新表或使用默认表
                # 这里我们简单地创建一个新表，或者如果项目刚创建且没有表，则创建第一个表
                # 为了简化，如果上传到现有项目且没指定表，我们创建一个以文件名命名的新表
                # 或者如果用户意图是追加，应该提供 tableId
                
                # 检查项目是否有表
                tables = get_tables_by_project(project_id)
                if not tables:
                    # 创建默认表
                    print(f"[UPLOAD] 项目无表格，创建默认表格")
                    table = create_table(project_id, data.projectName, schema, "默认数据表")
                    table_id = table.id
                else:
                    # 创建新表（假设每次上传都是新表，除非指定了 tableId）
                    # 或者我们可以查找同名的表？
                    # 暂时策略：创建新表
                    print(f"[UPLOAD] 创建新表格: {data.projectName}")
                    table = create_table(project_id, data.projectName, schema, f"上传于 {data.projectName}")
                    table_id = table.id
        else:
            # 1. 创建新项目
            print(f"[UPLOAD] 创建新项目...")
            
            project = create_project_in_db(
                name=data.projectName, 
                user_id=current_user.id,
                description=data.description,
                source_type="upload",
                source_metadata={"original_name": data.projectName},
                schema=None # Schema now lives in Table
            )
            project_id = project.id
            print(f"[UPLOAD] 项目创建成功，ID: {project_id}")
            
            # 创建默认表格
            print(f"[UPLOAD] 创建默认表格...")
            table = create_table(project_id, data.projectName, schema, "默认数据表")
            table_id = table.id
            print(f"[UPLOAD] 表格创建成功，ID: {table_id}")
        
        # 2. 保存项目数据到数据库，关联当前用户、项目ID和表格ID
        print(f"[UPLOAD] 开始保存 {len(data.items)} 个数据项到表格 {table_id}...")
        save_items_to_db(data.items, current_user.id, project_id, table_id)
        print(f"[UPLOAD] 数据保存成功")
        
        # 3. 更新项目的项数
        update_project_items_count(project_id, current_user.id, len(data.items))
        print(f"[UPLOAD] 项目计数更新成功")
        
        return {
            "message": f"项目 '{data.projectName}' 上传成功，共 {len(data.items)} 个项目",
            "projectId": project_id,
            "tableId": table_id,
            "schema": schema  # 返回 schema 供前端使用
        }
    except Exception as e:
        import traceback
        print(f"[UPLOAD ERROR] {str(e)}")
        print(f"[UPLOAD ERROR TRACEBACK] {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"上传失败: {str(e)}")

def infer_type(value):
    """推断数据类型"""
    if isinstance(value, bool):
        return "boolean"
    elif isinstance(value, (int, float)):
        return "number"
    elif isinstance(value, list):
        return "array"
    elif isinstance(value, dict):
        return "object"
    else:
        return "text"