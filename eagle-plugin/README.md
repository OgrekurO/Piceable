# Eagle 插件 (Eagle Plugin)

Eagle 插件作为数据桥接，运行在 Eagle 应用内部，通过 Eagle API 访问和操作数据，并启动 HTTP 服务为前端提供实时 Eagle 数据。

## 插件结构

```
eagle-plugin/
├── index.html      # 插件主页面
├── js/             # JavaScript 文件
│   ├── main.js     # 主要逻辑
│   └── util.js     # 工具函数
└── manifest.json   # 插件配置文件
```

## manifest.json 配置

```json
{
    "id": "587a5a6e-daf9-4b9d-8882-10640f816728",
    "version": "1.0.0",
    "platform": "all",
    "arch": "all",
    "name": "Eagle Ontology Frontend Bridge",
    "logo": "/logo.png",
    "keywords": ["ontology", "frontend", "bridge", "通信", "桥接"],
    "devTools": false,
    "serviceMode": true,
    "main": {
        "url": "index.html",
        "width": 800,
        "height": 600
    }
}
```

## 使用方法

1. 在 Eagle 中安装插件
2. 插件会自动启动 HTTP 服务
3. 前端应用通过 API 与插件通信获取数据

## 提供的 API

插件启动后会提供以下 API 接口：

- `GET /api/items` - 获取项目列表
- `GET /api/item/{id}` - 获取单个项目详情
- `GET /api/library` - 获取库信息
- `POST /api/sync` - 同步数据
- `POST /api/export` - 导出数据

## 数据流

```
┌─────────────────┐               ┌────────────────────┐               ┌──────────────┐
│   前端应用      │               │ Eagle插件(桥接)    │               │   Eagle应用  │
│ (独立网页)      │               │ (可启动HTTP服务)   │               │              │
└─────────────────┘               └────────────────────┘               └──────────────┘
         ▲                                  │                                     ▲
         │                                  │                                     │
         │                           eagle.api 调用                        eagle.api
         │                                  ▼                                     │
         │                       ┌────────────────────┐                          │
         │                       │  Eagle 数据源      │◄─────────────────────────┘
         │                       └────────────────────┘
         │                                  │
         │                           HTTP服务(实时数据)
         │                                  ▼
         │                       ┌────────────────────┐
         │                       │   FastAPI 后端     │
         │                       │   (用户管理等)     │
         │                       └────────────────────┘
```