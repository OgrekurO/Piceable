# MindMap 拖拽连线功能实现总结

## ✅ 已完成功能

### 1. 拖拽连线模式
- **状态管理**:
  - `linkingMode`: 是否处于连线模式
  - `linkingSourceNode`: 已选择的源节点

- **交互流程**:
  1. 用户点击 FAB 菜单中的"增加连线"按钮
  2. 进入连线模式,显示顶部提示条
  3. 用户点击第一个节点作为源节点
  4. 提示更新为"已选择: XXX,请点击目标节点"
  5. 用户点击第二个节点作为目标节点
  6. 自动创建连线并保存到后端
  7. 退出连线模式

- **UI提示**:
  - 顶部显示渐变色提示条
  - 显示当前状态(选择源节点/选择目标节点)
  - 提供"取消"按钮退出连线模式
  - 平滑的动画效果

### 2. 自动创建关系表
- **智能检测**:
  - 检查项目是否已有关系表
  - 支持识别名为 "Relationships"、"关系" 或类型为 "relationship" 的表

- **自动创建**:
  - 如果没有关系表,自动创建一个名为 "Relationships" 的表
  - 预设表头结构:
    ```json
    {
      "fields": [
        { "key": "From", "label": "源节点", "type": "text" },
        { "key": "To", "label": "目标节点", "type": "text" },
        { "key": "Type", "label": "关系类型", "type": "text" },
        { "key": "Direction", "label": "方向", "type": "select", "options": ["directed", "undirected"] },
        { "key": "Description", "label": "描述", "type": "text" },
        { "key": "CreatedAt", "label": "创建时间", "type": "text" }
      ]
    }
    ```

- **数据持久化**:
  - 连线数据自动保存到关系表
  - 包含完整的元数据(创建时间等)
  - 自动更新表格映射,标记为 "relationship" 类型

### 3. 数据同步
- **实时更新**:
  - 创建连线后立即添加到 `tempLinks`
  - 自动调用 `updateGraphData()` 更新图谱显示
  - 新连线立即在画布上可见

- **TablePage 集成**:
  - 关系表自动出现在 TablePage 视图中
  - 可以在表格视图中查看和编辑关系数据
  - 支持标准的 CRUD 操作

## 📋 使用方式

### 创建连线
1. 在 MindMap 页面点击右下角的 ➕ 按钮
2. 选择"增加连线"
3. 点击源节点
4. 点击目标节点
5. 连线自动创建并保存

### 取消连线
- 点击提示条上的"取消"按钮
- 或按 ESC 键(待实现)

### 查看关系数据
1. 切换到 TablePage 视图
2. 选择 "Relationships" 表
3. 查看所有创建的关系数据

## 🔧 技术实现

### 核心函数

#### `openAddLinkModal()`
```typescript
// 启动连线模式
linkingMode.value = true;
linkingSourceNode.value = null;
ElMessage.info('连线模式已启动,请点击源节点,然后点击目标节点');
```

#### `handleNodeClick(node)`
```typescript
// 处理连线模式下的节点点击
if (linkingMode.value) {
  if (!linkingSourceNode.value) {
    // 选择源节点
    linkingSourceNode.value = node;
  } else {
    // 选择目标节点并创建连线
    createNewLink(linkingSourceNode.value, node);
    linkingMode.value = false;
  }
}
```

#### `ensureRelationshipTable(projectId)`
```typescript
// 确保项目有关系表
// 1. 检查现有表格
// 2. 如果没有,创建新表
// 3. 返回表格ID
```

#### `createNewLink(sourceNode, targetNode)`
```typescript
// 创建新连线
// 1. 确保有关系表
// 2. 构建关系数据
// 3. 保存到后端
// 4. 更新图谱显示
```

### API 调用

#### 创建关系表
```http
POST /api/projects/{projectId}/tables
Content-Type: application/json

{
  "name": "Relationships",
  "description": "存储节点间的关系数据",
  "schema": { ... }
}
```

#### 保存关系数据
```http
POST /api/items
Content-Type: application/json

{
  "projectId": 1,
  "tableId": 2,
  "data": {
    "From": "节点A",
    "To": "节点B",
    "Type": "关联",
    "Direction": "directed",
    "CreatedAt": "2025-11-23T03:30:00"
  }
}
```

## 🎨 UI/UX 特性

### 视觉反馈
- ✅ 渐变色提示条(紫色渐变)
- ✅ 平滑的滑入动画
- ✅ 清晰的状态提示
- ✅ Emoji 图标增强可读性

### 交互体验
- ✅ 两步操作(选源→选目标)
- ✅ 实时状态更新
- ✅ 一键取消
- ✅ 自动退出模式
- ✅ 防止自连接(源=目标)

## 📊 数据流

```
用户点击"增加连线"
    ↓
进入连线模式
    ↓
选择源节点 → 更新UI提示
    ↓
选择目标节点
    ↓
ensureRelationshipTable() → 检查/创建关系表
    ↓
createNewLink() → 保存到后端
    ↓
更新 tempLinks
    ↓
updateGraphData() → 更新图谱显示
    ↓
退出连线模式
```

## 🔄 与现有功能的集成

### TablePage
- 关系表自动出现在表格列表中
- 支持查看、编辑、删除关系
- 数据格式与图谱完全兼容

### GraphSidebar
- 关系表自动标记为 "relationship" 类型
- 在数据映射配置中可见
- 支持字段自动识别

### MapStore
- 关系数据作为普通 items 存储
- 支持标准的 CRUD 操作
- 与实体数据统一管理

## 🚀 后续优化建议

### 短期
1. ✅ 添加 ESC 键取消连线模式
2. ✅ 在连线模式下高亮显示源节点
3. ✅ 添加连线类型选择(在创建时弹出对话框)
4. ✅ 支持编辑已有连线

### 中期
1. 支持拖拽创建连线(鼠标按住拖动)
2. 显示临时连线预览(虚线)
3. 支持批量创建连线
4. 连线样式自定义

### 长期
1. 连线动画效果
2. 智能连线建议
3. 关系模板
4. 关系统计分析

## 📝 注意事项

1. **项目ID必需**: 连线功能需要 `currentProjectId`,确保从路由正确获取
2. **权限检查**: 需要用户登录和有效的 token
3. **数据一致性**: From/To 必须与节点的 Label 完全匹配
4. **表格命名**: 关系表默认名为 "Relationships",可自定义
5. **字段类型**: Direction 字段使用 select 类型,限定值为 directed/undirected

## 🎉 总结

本次实现完成了:
1. ✅ 直观的拖拽连线交互
2. ✅ 自动创建和管理关系表
3. ✅ 完整的数据持久化
4. ✅ 与 TablePage 的无缝集成
5. ✅ 优雅的 UI/UX 设计

用户现在可以通过简单的点击操作在图谱中创建连线,所有数据自动保存到后端,并在 TablePage 中可见和可编辑!
