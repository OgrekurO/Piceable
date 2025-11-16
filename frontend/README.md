# 前端应用 (Frontend)

基于 Vue 3 + Vite 构建的现代化前端界面，用于展示和管理思维导图数据。

## 技术栈

- Vue 3
- Vite
- Element Plus
- TypeScript
- Pinia (状态管理)
- Vue Router (路由管理)

## 使用方法

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm run dev
```

默认会在 http://localhost:5173 启动开发服务器。

### 构建生产版本

```bash
npm run build
```

构建后的文件会输出到 `dist` 目录。

### 预览生产版本

```bash
npm run preview
```

### 代码检查

```bash
# 运行 ESLint 检查
npm run lint

# 格式化代码
npm run format
```

## 项目结构

```
src/
├── assets/           # 静态资源
├── components/       # 公共组件
├── composables/      # 组合式函数
├── layouts/          # 布局组件
├── modules/          # 功能模块
├── pages/            # 页面组件
├── plugins/          # 插件
├── router/           # 路由配置
├── stores/           # 状态管理
├── styles/           # 样式文件
├── utils/            # 工具函数
└── App.vue           # 根组件
```

## 环境要求

- Node.js >= 20.19.0 或 >= 22.12.0