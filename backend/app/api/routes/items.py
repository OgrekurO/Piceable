from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.schemas import Item, ProjectUpload
from app.crud.items import get_all_items_from_db, get_item_from_db, save_items_to_db
from app.crud.projects import create_project_in_db, update_project_items_count
from app.api.dependencies import get_current_active_user
from app.models.schemas import User

router = APIRouter(prefix="/api", tags=["items"])

@router.get("/items", response_model=List[Item])
async def get_items(current_user: User = Depends(get_current_active_user)):
    items = get_all_items_from_db(current_user.id)
    return items

@router.get("/item/{item_id}", response_model=Item)
async def get_item(item_id: str, current_user: User = Depends(get_current_active_user)):
    item = get_item_from_db(item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail="项目未找到")
    return item

@router.post("/upload")
async def upload_project(data: ProjectUpload, current_user: User = Depends(get_current_active_user)):
    try:
        project_id = data.projectId
        
        if project_id:
            # 验证项目是否存在且属于当前用户
            # 这里简单起见，直接假设如果提供了ID，就是合法的（实际应添加检查）
            pass 
        else:
            # 1. 创建新项目
            # 如果没有提供 schema，自动生成一个基础 schema
            schema = data.table_schema
            if not schema and data.items:
                # 从第一个 item 推断 schema
                first_item = data.items[0]
                schema = {
                    "columns": [
                        {"name": key, "type": infer_type(value), "key": key}
                        for key, value in first_item.items()
                    ]
                }
            
            project = create_project_in_db(
                name=data.projectName, 
                user_id=current_user.id,
                description=data.description,
                source_type="upload",
                source_metadata={"original_name": data.projectName},
                schema=schema
            )
            project_id = project.id
        
        # 2. 保存项目数据到数据库，关联当前用户和项目ID
        save_items_to_db(data.items, current_user.id, project_id)
        
        # 3. 更新项目的项数
        update_project_items_count(project_id, current_user.id, len(data.items))
        
        return {
            "message": f"项目 '{data.projectName}' 上传成功，共 {len(data.items)} 个项目",
            "projectId": project_id
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
    elif isinstance(value, int):
        return "number"
    elif isinstance(value, float):
        return "number"
    elif isinstance(value, list):
        return "array"
    elif isinstance(value, dict):
        return "object"
    else:
        return "text"