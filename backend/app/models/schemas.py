from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime


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

class UserPublic(UserBase):
    id: int

class User(UserBase):
    id: int
    hashed_password: str

class UserInDB(User):
    hashed_password: str

# 项目相关模型
class ProjectBase(BaseModel):
    model_config = {"populate_by_name": True}
    
    name: str
    description: Optional[str] = None
    source_type: Optional[str] = "manual"
    source_metadata: Optional[Any] = None
    table_schema: Optional[dict] = Field(None, alias="schema")  # 使用 alias 避免与 BaseModel.schema 冲突

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    created_at: datetime
    last_modified: datetime
    user_id: int
    items_count: int
    
    class Config:
        orm_mode = True

# 数据模型定义 - 动态 schema
class Item(BaseModel):
    id: str
    data: dict  # 动态数据
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class SyncData(BaseModel):
    items: Optional[List[str]] = None

class ExportOptions(BaseModel):
    format: Optional[str] = "json"

# 文件上传相关模型
class ProjectUpload(BaseModel):
    model_config = {"populate_by_name": True}
    
    projectName: str
    description: Optional[str] = None
    items: List[dict]  # 动态数据项
    table_schema: Optional[dict] = Field(None, alias="schema")  # 列定义，使用 alias
    projectId: Optional[int] = None



# 认证相关模型
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

