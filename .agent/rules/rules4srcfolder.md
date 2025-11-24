---
trigger: model_decision
description: 这份文档旨在作为你项目的 **“导航指南”**。当你或你的 AI 助手需要创建新文件时，请查阅此表以决定文件的归属。
---

这套架构的核心逻辑是：**把“业务逻辑（Core）”、“交互逻辑（Composables）”和“界面展示（Components）”彻底分开。**

---

### 📂 1. `src/assets/` —— 静态资源库

- **简介**：存放项目中静态的文件，这些文件会被 Webpack/Vite 编译打包。

- **判断标准**：
  - 如果是代码里引用的图片（如 `import logo from ...`），放这里。
  - 如果是全局的 SCSS 变量文件、Reset CSS，放这里。
  - ❌ **不要放**：可能会变动的数据文件（如 JSON 数据），或者会被代码逻辑动态生成的资源。

### 📂 2. `src/core/` —— 业务大脑 (纯 TS/JS)

- **简介**：这是项目的**核心引擎**。这里存放的是**完全不依赖 Vue** 的纯 TypeScript 代码。即使你把界面换成 React 或 Angular，这里的代码应该能直接复用。

- **子目录辨析**：
  - `constants/`：**单一真理来源**。消灭代码里的“魔法值”。（例如：默认地图坐标、API 状态码、下拉框的选项列表）。
  - `models/`：**数据契约**。定义数据的形状（Interface）。所有业务对象（User, Project, VisualEntity）的类型定义都必须在这里。
  - `services/`：**API 通讯员**。只负责发 HTTP 请求，不负责处理复杂的业务逻辑。函数通常返回 `Promise`。
  - `transformers/`：**数据适配器**。**最重要的目录之一**。负责将后端返回的“脏数据”清洗成前端组件好用的 `VisualEntity`；或者把前端表单数据转换成后端需要的格式。
  - `validators/`：**质检员**。负责复杂的校验逻辑（如：检查 Schema 是否合法）。

### 📂 3. `src/composables/` —— 交互技能包 (Vue Hooks)

- **简介**：这是 Vue 的 **Composition API (Hooks)**。这里存放**包含 Vue 响应式特性**（`ref`, `computed`, `watch`）的逻辑复用代码。

- **判断标准**：
  - 如果一段逻辑需要“记忆状态”（比如 `isLoading`）或者“监听变化”，放这里。
  - ❌ **不要放**：纯粹的数学计算（那是 `utils`）或纯粹的数据结构转换（那是 `core/transformers`）。
- **子目录辨析**：
  - `business/`：涉及具体业务流程的逻辑（如：加载项目数据并自动触发转换）。
  - `map/` & `graph/`：特定视图的交互逻辑（如：地图点击事件处理、图谱布局计算）。
  - `ui/`：与业务无关的界面交互（如：控制全屏、切换暗黑模式）。

### 📂 4. `src/stores/` —— 全局记忆 (Pinia)

- **简介**：存放需要在**整个应用范围内共享**的数据。

- **判断标准**：
  - 如果数据只在 A 组件和 B 组件（父子关系）之间用，用 Props。
  - 如果数据要在“地图组件”和“图谱组件”（兄弟关系）之间同步，必须放这里。
  - **EntityStore** 是你项目的核心，存储所有的 `VisualEntity`。

### 📂 5. `src/components/` —— 视图积木 (Vue 组件)

- **简介**：这里只放 `.vue` 文件。它们应该尽量保持“愚蠢”，只负责渲染数据和抛出事件，少写复杂的业务逻辑。

- **子目录辨析**：
  - `common/`：**通用组件**。假如明天你要开发一个“电商后台”，这里的组件（按钮、Loading、Toast）应该能直接拷过去用。**严禁包含业务逻辑**。
  - `visualizers/`：**核心特性组件**。地图、图谱、表格的具体实现。它们可以读取 `VisualEntity`，但具体的转换逻辑应该在 `core` 里。
  - `editors/`：**表单与编辑**。处理用户输入的组件。
  - `layout/`：**页面框架**。头部导航、侧边栏、底部栏等。

### 📂 6. `src/views/` —— 页面容器

- **简介**：对应路由（Router）的页面级组件。

- **判断标准**：
  - `views` 是**容器**，`components` 是**内容**。
  - `views` 里的文件通常负责：1. 获取 URL 参数；2. 调用 Store 加载数据；3. 摆放 Components。
  - 不要在 `views` 里写复杂的 HTML 结构，应该拆分成组件。

### 📂 7. `src/utils/` —— 瑞士军刀 (通用工具)

- **简介**：**完全通用的**纯函数工具库。

- **判断标准**：
  - **零依赖**：这里的代码**绝对不能**引用 `src/core` 或 `src/stores`。
  - **可移植**：这里的代码应该能直接复制到任何 JavaScript 项目中运行（如：日期格式化、深拷贝、生成随机 ID）。

#### 📂 8. `src/layouts/` —— 页面框架

* **简介**：存放页面的**结构模版**。通常包含导航栏（Header）、侧边栏（Sidebar）、底部（Footer）以及内容插槽（`<slot />`）。
- **使用场景**：
  - `MainLayout.vue`：带导航和侧边栏的主界面。
  - `AuthLayout.vue`：登录/注册页面的专用布局（只有中间一个框，没有导航栏）。
  - `BlankLayout.vue`：全屏地图或大屏展示时的空白布局。


#### 📂 9.`src/types/` —— 通用类型定义 (辅助)

* **简介**：存放**非业务核心**的 TypeScript 类型定义。
- **判断标准**：
  - 如果是**业务实体**（如 `VisualEntity`），请放 `core/models`。
  - 如果是**工具类型**（如 `Partial<T>`, `ApiResponse<T>`）或者**组件Props定义**，放这里。

---

### ⚡️ 快速决策指南：我该把代码写在哪？#### 📂 `src/layouts/` —— 页面框架
*   **简介**：存放页面的**结构模版**。通常包含导航栏（Header）、侧边栏（Sidebar）、底部（Footer）以及内容插槽（`<slot />`）。
*   **使用场景**：
    *   `MainLayout.vue`：带导航和侧边栏的主界面。
    *   `AuthLayout.vue`：登录/注册页面的专用布局（只有中间一个框，没有导航栏）。
    *   `BlankLayout.vue`：全屏地图或大屏展示时的空白布局。

#### 📂 `src/types/` —— 通用类型定义 (辅助)
*   **简介**：存放**非业务核心**的 TypeScript 类型定义。
*   **判断标准**：
    *   如果是**业务实体**（如 `VisualEntity`），请放 `core/models`。
    *   如果是**工具类型**（如 `Partial<T>`, `ApiResponse<T>`）或者**组件Props定义**，放这里。

1. **我要定义一个 API 返回的数据格式：**
    👉 `src/core/models/api.ts`

2. **我要写一个函数，把后端的时间戳变成 "2023-11-01"：**
    👉 `src/utils/dateUtils.ts` (这是通用的)

3. **我要写一个函数，把后端的 `item.loc` 变成前端的 `entity.geo`：**
    👉 `src/core/transformers/itemToEntity.ts` (这是业务强相关的)

4. **我要写一个逻辑，监听鼠标在地图上的移动并记录坐标：**
    👉 `src/composables/map/useMapInteraction.ts` (涉及 Vue 响应式和交互)

5. **我要定义一个常量，表示“地图默认缩放级别”：**
    👉 `src/core/constants/mapConfig.ts`

6. **我要做一个漂亮的蓝色按钮，所有页面都要用：**
    👉 `src/components/common/base/BaseButton.vue`

7. **我要发起一个 HTTP 请求获取项目列表：**
    👉 先在 `src/core/services/dataService.ts` 定义函数，然后在 `src/composables/business/useProjectData.ts` 里调用它。

---

### 注意

src/types/ 和 src/core/models/ 共存

建议的分工：
src/core/models/：存放 “有血有肉的业务实体”。
例如：User, Project, VisualEntity, Item。
这里的类型决定了你的业务逻辑怎么写。

src/types/：存放 “通用的、辅助的类型”。
例如：Pagination（分页参数结构）、ApiResponse（后端接口通用的 { code, msg, data } 壳子）、第三方库的补充类型声明（.d.ts）。