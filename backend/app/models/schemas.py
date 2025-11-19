from pydantic import BaseModel
from typing import List, Optional

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

# 用户相关模型
class UserBase(BaseModel):
    username: str
    email: str
    is_active: bool = True
    role_id: int = 1
    
    class Config:
        # 使API返回的字段名与前端保持一致
        fields = {
            'is_active': 'isActive',
            'role_id': 'roleId'
        }

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    hashed_password: str
    
    class Config:
        # 使API返回的字段名与前端保持一致
        fields = {
            'is_active': 'isActive',
            'role_id': 'roleId'
        }

class UserInDB(User):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None