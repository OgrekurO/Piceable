# Piceable

Piceable 是一个基于 Web 的轻量级数据可视化管理工具，提供多种数据展示方式，包括表格、2D坐标、3D坐标、思维导图和地图视图。

## 项目结构

```
.
├── backend/                      # 后端服务 (FastAPI)
│   ├── app/                     # 应用核心目录
│   │   ├── api/                # API路由定义
│   │   │   └── routes/        # 各模块路由
│   │   ├── auth/               # 认证模块(JWT)
│   │   ├── crud/               # 数据库操作
│   │   ├── database/           # 数据库配置和初始化
│   │   ├── models/             # 数据模型定义
│   │   └── schemas/            # Pydantic模型/数据验证
│   ├── main.py                 # 应用入口文件
│   └── requirements.txt        # Python依赖
├── frontend/                    # 前端应用 (Vue3)
│   ├── public/                 # 静态资源
│   └── src/                    # 源代码目录
│       ├── assets/             # 静态资源(图片、样式等)
│       ├── components/         # 可复用组件
│       ├── constants/          # 常量定义
│       ├── layouts/            # 页面布局组件
│       ├── router/             # 路由配置
│       ├── services/           # HTTP服务和业务逻辑
│       ├── stores/             # 状态管理(Pinia)
│       ├── types/              # TypeScript类型定义
│       ├── utils/              # 工具函数
│       ├── views/              # 页面组件
│       ├── App.vue             # 根组件
│       └── main.ts             # 应用入口文件
├── eagle-plugin/                # Eagle插件（数据桥接）
│   ├── manifest.json           # 插件配置文件
│   └── main.js                 # 插件入口文件
├── 项目辅助文档/                 # 项目文档
│   ├── docs/                   # API和技术文档
│   ├── 开发计划清单.md           # 开发计划
│   ├── 技术文档.md              # 技术架构说明
│   └── 需求文档 2.0.md         # 产品需求文档
├── docker-compose.yml          # Docker编排配置
└── README.md                   # 项目说明文档
```

## 技术栈

- **前端**: Vue 3, Pinia, Vite, Element Plus, Vxe-Table, D3.js, Three.js
- **后端**: FastAPI (Python), SQLite
- **数据可视化**: D3.js (思维导图), Three.js (3D坐标), Leaflet (地图)

## 功能特性

- 用户认证和权限管理
- 项目和数据管理
- 多种数据可视化展示方式
- 表格数据编辑和导出
- 管理员面板（用户管理）

## 快速开始

### 后端服务

```bash
# 安装依赖
cd backend
pip install -r requirements.txt

# 运行服务
python main.py
```

后端服务默认运行在 http://localhost:8001

### 前端应用

```bash
# 安装依赖
cd frontend
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build
```

前端应用默认运行在 http://localhost:5173

## 开发流程

1. 启动后端服务
2. 启动前端开发服务
3. 访问前端应用进行开发和测试

## 目前状态

项目核心功能已完成，包括用户管理、项目管理、数据可视化展示等。Eagle插件部分尚未完全实现。