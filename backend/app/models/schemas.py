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
    isActive: bool = True
    roleId: int = 1
    
    class Config:
        # 允许使用别名，并在序列化时使用别名
        allow_population_by_field_name = True

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    hashed_password: str
    
    class Config:
        # 允许使用别名，并在序列化时使用别名
        allow_population_by_field_name = True

class UserInDB(User):
    class Config:
        # 允许使用别名，并在序列化时使用别名
        allow_population_by_field_name = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None