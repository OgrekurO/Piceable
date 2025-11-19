# 后端服务 (Backend)

基于 FastAPI 构建的后端服务，提供 HTTP API 处理用户管理等核心业务功能。

## 技术栈

- Python 3.8+
- FastAPI (Web 框架)
- Uvicorn (ASGI 服务器)
- Pydantic (数据验证)
- SQLite/PostgreSQL (数据库)

## 项目结构

```
app/                    # 主应用目录
├── main.py             # 应用入口点
├── config.py           # 配置文件
├── models/             # 数据模型
│   └── schemas.py
├── database/           # 数据库相关
│   ├── connection.py
│   └── init_db.py
├── auth/               # 认证相关
│   ├── security.py
│   └── jwt.py
├── crud/               # 数据访问层
│   ├── items.py
│   └── users.py
└── api/                # API路由
    ├── dependencies.py
    └── routes/
        ├── auth.py
        ├── items.py
        └── library.py
```

## 使用方法

### 安装依赖

```bash
pip install -r requirements.txt
```

### 初始化数据库

```bash
python init_db.py
```

### 运行服务

```bash
python -m app.main
```

服务将在 http://localhost:8001 启动。

## API 接口

### 认证相关

- `POST /api/auth/token` - 用户登录，获取访问令牌
- `POST /api/auth/register` - 用户注册

### 用户相关

- `GET /api/users/me` - 获取当前用户信息

### 数据相关

- `GET /` - 根路径，返回欢迎信息
- `GET /api/items` - 获取项目列表
- `GET /api/item/{item_id}` - 获取单个项目
- `PUT /api/item/{item_id}` - 更新项目
- `GET /api/library` - 获取库信息
- `POST /api/sync` - 同步数据
- `POST /api/export` - 导出数据

## 数据模型

### Item（项目）

```json
{
  "id": "string",
  "name": "string",
  "folders": ["string"],
  "tags": ["string"],
  "annotation": "string",
  "url": "string",
  "lastModified": "integer",
  "thumbnail": "string"
}
```

### LibraryInfo（库信息）

```json
{
  "name": "string",
  "path": "string",
  "itemsCount": "integer",
  "version": "string"
}
```

### SyncData（同步数据）

```json
{
  "items": ["string"]
}
```

### ExportOptions（导出选项）

```json
{
  "format": "string"
}
```

### User（用户）

```json
{
  "id": "integer",
  "username": "string",
  "email": "string",
  "is_active": "boolean",
  "role_id": "integer"
}
```

### Token（访问令牌）

```json
{
  "access_token": "string",
  "token_type": "string"
}
```