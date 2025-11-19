from fastapi import APIRouter, Depends
from typing import List
from app.models.schemas import Item, LibraryInfo
from app.crud.items import get_all_items_from_db, get_item_from_db, get_library_info_from_db, update_library_items_count

router = APIRouter(prefix="/api", tags=["items"])

@router.get("/items", response_model=List[Item])
async def get_items():
    items = get_all_items_from_db()
    # 更新库信息中的项目计数
    update_library_items_count(len(items))
    return items

@router.get("/item/{item_id}", response_model=Item)
async def get_item(item_id: str):
    item = get_item_from_db(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="项目未找到")
    return item

@router.get("/library", response_model=LibraryInfo)
async def get_library_info():
    info = get_library_info_from_db()
    if not info:
        raise HTTPException(status_code=404, detail="库信息未找到")
    return info