from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import json
from datetime import datetime
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.models.schemas import Item, LibraryInfo, SyncData, ExportOptions, User, UserCreate, UserInDB, Token, TokenData
from app.database.init_db import init_db
from app.api.routes import auth, items
from app.api.dependencies import get_current_active_user

app = FastAPI(title="Eagle Ontology Manager API", version="2.0")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex="https?://.*",
    expose_headers=["Access-Control-Allow-Origin"]
)

# 包含路由
app.include_router(auth.router)
app.include_router(items.router)

# 初始化数据库
@app.on_event("startup")
def startup_event():
    init_db()

# 其他路由
@app.get("/api/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.get("/")
def read_root():
    return {"message": "Eagle Ontology Manager API"}

@app.post("/api/sync")
async def sync_data(sync_data: SyncData, current_user: User = Depends(get_current_active_user)):
    # 这里应该实现实际的同步逻辑
    return {"message": f"同步了 {len(sync_data.items or [])} 个项目"}

@app.post("/api/export")
async def export_data(options: ExportOptions, current_user: User = Depends(get_current_active_user)):
    # 这里应该实现实际的导出逻辑
    return {"message": f"导出格式: {options.format}"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)