from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime


# 用户相关模型
class UserBase(BaseModel):
    username: str
    email: str
    isActive: bool = True
    roleId: int = 2
    
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

# 字段类型枚举
from enum import Enum

class FieldType(str, Enum):
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    DATE_RANGE = "date_range"
    GEO_POINT = "geo_point"
    RELATION = "relation"
    SELECT = "select"
    MULTI_SELECT = "multi_select"
    IMAGE = "image"
    URL = "url"

# 字段定义模型
class FieldDefinition(BaseModel):
    key: str
    label: str
    type: FieldType
    is_primary: bool = False
    options: Optional[List[str]] = None  # 用于 select/multi_select
    related_target: Optional[str] = None  # 用于 relation，指向的目标类型（目前通常是 'item'）
    
    class Config:
        use_enum_values = True

# 项目 Schema 定义
class ProjectSchema(BaseModel):
    fields: List[FieldDefinition]
    view_settings: Optional[dict] = None

# 2. 表格模型（必须在 Project 之前定义）
class TableBase(BaseModel):
    name: str
    description: Optional[str] = None
    schema_def: Optional[ProjectSchema] = Field(None, alias="schema")

class TableCreate(TableBase):
    pass

class Table(TableBase):
    id: int
    project_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

# 1. 项目相关模型
class ProjectBase(BaseModel):
    model_config = {"populate_by_name": True}
    
    name: str
    description: Optional[str] = None
    source_type: Optional[str] = "manual"
    source_metadata: Optional[Any] = None
    # schema moved to Table, but keeping it optional for backward compatibility during migration
    # or as a read-only view of the "main" table's schema
    
class ProjectCreate(ProjectBase):
    table_schema: Optional[dict] = Field(None, alias="schema")

class Project(ProjectBase):
    id: int
    created_at: datetime
    last_modified: datetime
    user_id: int
    items_count: int
    tables: Optional[List[Table]] = []
    
    class Config:
        orm_mode = True



# 3. 数据模型定义 - 动态 schema
class Item(BaseModel):
    id: str
    data: dict  # 动态数据
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    table_id: Optional[int] = None # 新增 table_id

class ItemCreate(BaseModel):
    projectId: int
    tableId: int
    data: dict

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
    tableId: Optional[int] = None # 新增 tableId
    
    @classmethod
    def model_validate(cls, obj):
        print(f"[ProjectUpload] 验证数据: {obj}")
        try:
            result = super().model_validate(obj)
            print(f"[ProjectUpload] 验证成功")
            return result
        except Exception as e:
            print(f"[ProjectUpload] 验证失败: {e}")
            raise



# 认证相关模型
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

