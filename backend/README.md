# 后端服务 (Backend)

基于 FastAPI 构建的后端服务，提供 HTTP API 处理用户管理等核心业务功能。

## 技术栈

- Python 3.8+
- FastAPI (Web 框架)
- Uvicorn (ASGI 服务器)
- Pydantic (数据验证)

## 使用方法

### 安装依赖

```bash
pip install -r requirements.txt
```

### 运行服务

```bash
python main.py
```

服务将在 http://localhost:3001 启动。

## API 接口

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