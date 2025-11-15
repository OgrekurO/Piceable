from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import json

app = FastAPI(title="Eagle Ontology Manager API", version="2.0")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型定义
class Item(BaseModel):
    id: str
    name: str
    folders: List[str]
    tags: List[str]
    annotation: str
    url: str
    lastModified: int
    thumbnail: str

class LibraryInfo(BaseModel):
    name: str
    path: str
    itemsCount: int
    version: str

class SyncData(BaseModel):
    items: Optional[List[str]] = None

class ExportOptions(BaseModel):
    format: Optional[str] = "json"

# 模拟数据
mock_items = [
    Item(
        id="item-1",
        name="示例项目1",
        folders=["文件夹1"],
        tags=["示例", "测试"],
        annotation="这是一个示例项目",
        url="http://example.com/image1.jpg",
        lastModified=1763223811305,
        thumbnail=""
    ),
    Item(
        id="item-2",
        name="示例项目2",
        folders=["文件夹2"],
        tags=["示例", "演示"],
        annotation="这是另一个示例项目",
        url="http://example.com/image2.jpg",
        lastModified=1763137411305,
        thumbnail=""
    )
]

mock_library_info = LibraryInfo(
    name="示例库",
    path="/path/to/library",
    itemsCount=len(mock_items),
    version="1.0.0"
)

# API路由
@app.get("/")
async def root():
    return {"message": "Eagle Ontology Manager API"}

@app.get("/api/items")
async def get_items():
    """获取项目列表"""
    return {
        "success": True,
        "data": mock_items,
        "count": len(mock_items)
    }

@app.get("/api/item/{item_id}")
async def get_item(item_id: str):
    """获取单个项目"""
    for item in mock_items:
        if item.id == item_id:
            return {
                "success": True,
                "data": item
            }
    return {
        "success": False,
        "error": "Item not found"
    }

@app.put("/api/item/{item_id}")
async def update_item(item_id: str, item: Item):
    """更新项目"""
    for i, existing_item in enumerate(mock_items):
        if existing_item.id == item_id:
            mock_items[i] = item
            return {
                "success": True,
                "message": "Item updated successfully",
                "data": item
            }
    return {
        "success": False,
        "error": "Item not found"
    }

@app.get("/api/library")
async def get_library_info():
    """获取库信息"""
    return {
        "success": True,
        "data": mock_library_info
    }

@app.post("/api/sync")
async def sync_data(sync_data: SyncData):
    """同步数据"""
    return {
        "success": True,
        "message": "Data synced successfully",
        "data": {
            "itemsProcessed": len(sync_data.items) if sync_data.items else 0
        }
    }

@app.post("/api/export")
async def export_data(export_options: ExportOptions):
    """导出数据"""
    return {
        "success": True,
        "message": "Data exported successfully",
        "data": {
            "format": export_options.format or "json",
            "exportedAt": "2025-11-16T00:00:00Z"
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3001)