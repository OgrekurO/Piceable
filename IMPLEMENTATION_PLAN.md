# MindMap 连线功能实现计划

## 需求
1. 拖拽连线模式: 点击"增加连线"后,进入拖拽模式,从一个节点拉线到另一个节点
2. 自动创建关系表: 当创建连线时,自动在项目中创建一个关系表来存储连线数据

## 实现步骤

### 第1步: 拖拽连线模式 ✅
- [x] 添加 `linkingMode` 和 `linkingSourceNode` 状态
- [x] 修改 `openAddLinkModal` 启动连线模式
- [x] 修改 `handleNodeClick` 处理连线模式下的点击
- [ ] 实现 `createNewLink` 函数

### 第2步: 自动创建关系表
- [ ] 实现 `ensureRelationshipTable` 函数
  - 检查项目是否已有关系表
  - 如果没有,创建一个名为 "Relationships" 的表
  - 预设表头: From, To, Type, Direction, Description, CreatedAt
- [ ] 在 `createNewLink` 中调用 `ensureRelationshipTable`
- [ ] 将新连线保存到关系表

### 第3步: 后端API支持
- [ ] 确保 `/api/items` POST 接口支持添加单个item
- [ ] 确保 `/api/projects/{id}/tables` POST 接口支持创建表格

### 第4步: UI改进
- [ ] 在连线模式下高亮显示源节点
- [ ] 添加取消连线模式的按钮/快捷键(ESC)
- [ ] 在GraphCanvas中绘制临时连线预览

## 数据结构

### 关系表 Schema
```json
{
  "fields": [
    { "key": "From", "label": "源节点", "type": "text", "required": true },
    { "key": "To", "label": "目标节点", "type": "text", "required": true },
    { "key": "Type", "label": "关系类型", "type": "text", "required": false },
    { "key": "Direction", "label": "方向", "type": "select", "options": ["directed", "undirected"], "required": false },
    { "key": "Description", "label": "描述", "type": "text", "required": false },
    { "key": "CreatedAt", "label": "创建时间", "type": "text", "required": false }
  ]
}
```

### 关系数据项
```json
{
  "From": "节点A的Label",
  "To": "节点B的Label",
  "Type": "关联",
  "Direction": "directed",
  "Description": "",
  "CreatedAt": "2025-11-23T03:30:00"
}
```
