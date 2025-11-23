# 项目API文档

## 概述

本文档描述了Piceable项目的后端API接口，包括用户管理、数据管理、认证等相关接口。

## 基础URL

```
http://localhost:8000
```

## 认证

大部分API需要认证，通过在请求头中添加`Authorization`字段实现：

```
Authorization: Bearer <token>
```

## API接口

### 1. 认证接口

#### 用户登录
- **URL**: `/api/auth/token`
- **方法**: `POST`
- **描述**: 用户登录获取访问令牌
- **请求参数** (form-data):
  - `username`: 用户名
  - `password`: 密码
- **成功响应**:
  ```json
  {
    "access_token": "string",
    "token_type": "bearer"
  }
  ```
- **错误响应**:
  ```json
  {
    "detail": "用户名或密码错误"
  }
  ```

#### 用户注册
- **URL**: `/api/auth/register`
- **方法**: `POST`
- **描述**: 新用户注册
- **请求参数**:
  ```json
  {
    "username": "string",
    "password": "string",
    "email": "string",
    "isActive": "boolean",
    "roleId": "integer"
  }
  ```
- **成功响应**:
  ```json
  {
    "id": "integer",
    "username": "string",
    "email": "string",
    "isActive": "boolean",
    "roleId": "integer"
  }
  ```
- **错误响应**:
  ```json
  {
    "detail": "用户已存在"
  }
  ```

#### 获取当前用户信息
- **URL**: `/api/auth/users/me`
- **方法**: `GET`
- **描述**: 获取当前登录用户的信息
- **请求头**: 需要认证
- **成功响应**:
  ```json
  {
    "id": "integer",
    "username": "string",
    "email": "string",
    "isActive": "boolean",
    "roleId": "integer"
  }
  ```

#### 获取所有用户（仅管理员）
- **URL**: `/api/auth/users`
- **方法**: `GET`
- **描述**: 获取所有用户列表（仅管理员）
- **请求头**: 需要认证和管理员权限（roleId = 1）
- **成功响应**:
  ```json
  [
    {
      "id": "integer",
      "username": "string",
      "email": "string",
      "isActive": "boolean",
      "roleId": "integer"
    }
  ]
  ```

#### 更新用户角色（仅管理员）
- **URL**: `/api/auth/users/{user_id}/role`
- **方法**: `PUT`
- **描述**: 更新指定用户角色（仅管理员）
- **请求头**: 需要认证和管理员权限（roleId = 1）
- **路径参数**:
  - `user_id`: 用户ID
- **请求参数**:
  - `role_id`: 角色ID（1=管理员，2=普通用户）
- **成功响应**:
  ```json
  {
    "message": "用户角色更新成功"
  }
  ```

### 2. 项目管理接口

#### 获取所有项目
- **URL**: `/api/projects/`
- **方法**: `GET`
- **描述**: 获取当前用户的所有项目
- **请求头**: 需要认证
- **成功响应**:
  ```json
  [
    {
      "id": "integer",
      "name": "string",
      "description": "string",
      "source_type": "string",
      "source_metadata": "object",
      "created_at": "datetime",
      "last_modified": "datetime",
      "user_id": "integer",
      "items_count": "integer",
      "tables": "array"
    }
  ]
  ```

#### 创建项目
- **URL**: `/api/projects/`
- **方法**: `POST`
- **描述**: 创建新项目
- **请求头**: 需要认证
- **请求参数**:
  ```json
  {
    "name": "string",
    "description": "string",
    "source_type": "string",
    "source_metadata": "object"
  }
  ```
- **成功响应**:
  ```json
  {
    "id": "integer",
    "name": "string",
    "description": "string",
    "source_type": "string",
    "source_metadata": "object",
    "created_at": "datetime",
    "last_modified": "datetime",
    "user_id": "integer",
    "items_count": "integer",
    "tables": "array"
  }
  ```

#### 获取指定项目
- **URL**: `/api/projects/{project_id}`
- **方法**: `GET`
- **描述**: 获取指定项目数据
- **请求头**: 需要认证
- **路径参数**:
  - `project_id`: 项目ID
- **成功响应**:
  ```json
  {
    "id": "integer",
    "name": "string",
    "description": "string",
    "source_type": "string",
    "source_metadata": "object",
    "created_at": "datetime",
    "last_modified": "datetime",
    "user_id": "integer",
    "items_count": "integer",
    "tables": "array"
  }
  ```

#### 删除项目
- **URL**: `/api/projects/{project_id}`
- **方法**: `DELETE`
- **描述**: 删除指定项目
- **请求头**: 需要认证
- **路径参数**:
  - `project_id`: 项目ID
- **成功响应**:
  ```json
  {
    "message": "项目删除成功"
  }
  ```

#### 获取项目表格
- **URL**: `/api/projects/{project_id}/tables`
- **方法**: `GET`
- **描述**: 获取指定项目的所有表格
- **请求头**: 需要认证
- **路径参数**:
  - `project_id`: 项目ID
- **成功响应**:
  ```json
  [
    {
      "id": "integer",
      "name": "string",
      "description": "string",
      "schema": "object",
      "project_id": "integer",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ]
  ```

#### 创建项目表格
- **URL**: `/api/projects/{project_id}/tables`
- **方法**: `POST`
- **描述**: 在指定项目中创建新表格
- **请求头**: 需要认证
- **路径参数**:
  - `project_id`: 项目ID
- **请求参数**:
  ```json
  {
    "name": "string",
    "description": "string",
    "schema": "object"
  }
  ```
- **成功响应**:
  ```json
  {
    "id": "integer",
    "name": "string",
    "description": "string",
    "schema": "object",
    "project_id": "integer",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
  ```

### 3. 数据项管理接口

#### 获取所有数据项
- **URL**: `/api/items`
- **方法**: `GET`
- **描述**: 获取所有数据项
- **请求头**: 需要认证
- **查询参数**:
  - `projectId` (可选): 项目ID
  - `tableId` (可选): 表格ID
- **成功响应**:
  ```json
  [
    {
      "id": "string",
      "data": "object",
      "created_at": "datetime",
      "updated_at": "datetime",
      "table_id": "integer"
    }
  ]
  ```

#### 获取指定数据项
- **URL**: `/api/item/{item_id}`
- **方法**: `GET`
- **描述**: 获取指定数据项
- **请求头**: 需要认证
- **路径参数**:
  - `item_id`: 数据项ID
- **成功响应**:
  ```json
  {
    "id": "string",
    "data": "object",
    "created_at": "datetime",
    "updated_at": "datetime",
    "table_id": "integer"
  }
  ```

#### 创建数据项
- **URL**: `/api/items`
- **方法**: `POST`
- **描述**: 创建新数据项
- **请求头**: 需要认证
- **请求参数**:
  ```json
  {
    "projectId": "integer",
    "tableId": "integer",
    "data": "object"
  }
  ```
- **成功响应**:
  ```json
  {
    "id": "string",
    "data": "object",
    "created_at": "datetime",
    "updated_at": "datetime",
    "table_id": "integer"
  }
  ```

#### 更新数据项
- **URL**: `/api/item/{item_id}`
- **方法**: `PUT`
- **描述**: 更新指定数据项
- **请求头**: 需要认证
- **路径参数**:
  - `item_id`: 数据项ID
- **请求参数**:
  ```json
  {
    "data": "object"
  }
  ```
- **成功响应**:
  ```json
  {
    "message": "项目更新成功"
  }
  ```

#### 上传项目数据
- **URL**: `/api/upload`
- **方法**: `POST`
- **描述**: 上传项目数据（创建新项目或添加到现有项目）
- **请求头**: 需要认证
- **请求参数**:
  ```json
  {
    "projectName": "string",
    "description": "string",
    "items": "array",
    "schema": "object",
    "projectId": "integer",
    "tableId": "integer"
  }
  ```
- **成功响应**:
  ```json
  {
    "message": "string",
    "projectId": "integer",
    "tableId": "integer"
  }
  ```

## 错误响应格式

所有错误响应都遵循以下格式：

```json
{
  "detail": "错误描述信息"
}
```

## 状态码

- `200`: 请求成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未认证
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

## 用户角色

- `1`: 管理员
- `2`: 普通用户

## 数据模型

### 用户模型
```json
{
  "id": "integer",
  "username": "string",
  "email": "string",
  "isActive": "boolean",
  "roleId": "integer"
}
```

### 项目模型
```json
{
  "id": "integer",
  "name": "string",
  "description": "string",
  "source_type": "string",
  "source_metadata": "object",
  "created_at": "datetime",
  "last_modified": "datetime",
  "user_id": "integer",
  "items_count": "integer",
  "tables": "array"
}
```

### 表格模型
```json
{
  "id": "integer",
  "name": "string",
  "description": "string",
  "schema": "object",
  "project_id": "integer",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 数据项模型
```json
{
  "id": "string",
  "data": "object",
  "created_at": "datetime",
  "updated_at": "datetime",
  "table_id": "integer"
}
```