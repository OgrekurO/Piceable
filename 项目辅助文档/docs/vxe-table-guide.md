# Vxe-Table 使用辅助文档

## 概述

Vxe-Table 是一个基于 Vue 的表格组件库，提供了丰富的功能和良好的性能。在我们的项目中，主要使用 `vxe-grid` 组件来构建数据表格，通过配置对象驱动表格渲染。

## 安装与配置

### 安装依赖

```bash
npm install vxe-table vxe-pc-ui xe-utils
```

### 全局注册

在 `main.ts` 中全局注册 Vxe-Table：

```typescript
import { createApp } from 'vue'
import VXETable from 'vxe-table'
import 'vxe-table/lib/style.css'

const app = createApp(App)
app.use(VXETable)
app.mount('#app')
```

### 组件内注册

在需要使用的组件中注册特定组件：

```typescript
import { VXETable, VxeGrid } from 'vxe-table'
VXETable.use(VxeGrid)
```

## 基本使用

### 使用 vxe-grid 组件

推荐使用 `vxe-grid` 组件，通过配置对象驱动表格渲染：

```vue
<template>
  <vxe-grid 
    ref="gridRef"
    v-bind="gridOptions"
    v-on="gridEvents">
  </vxe-grid>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { VxeGridInstance, VxeGridProps } from 'vxe-table'

interface RowVO {
  id: number
  name: string
  role: string
  sex: string
  age: number
}

const gridRef = ref<VxeGridInstance<RowVO>>()
const gridOptions = reactive<VxeGridProps<RowVO>>({
  border: true,
  showOverflow: 'title',
  rowConfig: {
    isHover: true
  },
  columns: [
    { type: 'seq', width: 60 },
    { field: 'name', title: 'Name' },
    { field: 'role', title: 'Role' },
    { field: 'sex', title: 'Sex' },
    { field: 'age', title: 'Age' }
  ],
  data: [
    { id: 10001, name: 'Test1', role: 'Develop', sex: 'Man', age: 28 }
  ]
})

const gridEvents: VxeGridListeners<RowVO> = {
  cellClick({ row }) {
    console.log('点击了行', row)
  }
}
</script>
```

## 核心配置项

### 表格配置 (gridOptions)

```typescript
const gridOptions = reactive<VxeGridProps<Item>>({
  // 边框
  border: true,
  
  // 文本溢出显示为 title
  showOverflow: 'title',
  
  // 行配置
  rowConfig: {
    isHover: true
  },
  
  // 表格高度
  height: 600,
  
  // 列配置
  columns: [
    { 
      field: 'thumbnail', 
      title: '预览', 
      width: 100, 
      slots: { default: 'thumbnail_default' } 
    },
    // 更多列...
  ],
  
  // 分页配置
  pagerConfig: {
    currentPage: 1,
    pageSize: 20,
    pageSizes: [10, 20, 50, 100, 200, 500]
  },
  
  // 工具栏配置
  toolbarConfig: {
    refresh: true,
    custom: true
  },
  
  // 代理配置（用于服务端分页）
  proxyConfig: {
    response: {
      result: 'result',
      total: 'total'
    },
    ajax: {
      query: () => {
        // 查询逻辑
      }
    }
  }
})
```

### 项目中实际使用的配置示例

```typescript
// 项目中实际使用的配置
const gridOptions = reactive<VxeGridProps<Item>>({
  border: true,
  showOverflow: 'title',
  rowConfig: {
    isHover: true
  },
  height: 600,
  columns: [
    { field: 'thumbnail', title: '预览', width: 100, slots: { default: 'thumbnail_default' } },
    { field: 'name', title: '名称', width: 200, slots: { default: 'name_default' } },
    { field: 'folders', title: '文件夹', width: 150, slots: { default: 'folders_default' } },
    { field: 'tags', title: '标签', width: 200, slots: { default: 'tags_default' } },
    { field: 'annotation', title: '注释', width: 300, slots: { default: 'annotation_default' } },
    { field: 'lastModified', title: '最后修改', width: 180 },
    { field: 'actions', title: '操作', width: 150, fixed: 'right', slots: { default: 'actions_default' } }
  ],
  pagerConfig: {
    currentPage: 1,
    pageSize: 50,
    pageSizes: [10, 20, 50, 100, 200, 500]
  },
  toolbarConfig: {
    refresh: true,
    custom: true
  },
  proxyConfig: {
    props: {
      result: 'result',
      total: 'total'
    },
    ajax: {
      query: () => {
        return new Promise(resolve => {
          // 模拟分页数据
          const pagerConfig = gridOptions.pagerConfig
          const start = (pagerConfig.currentPage - 1) * pagerConfig.pageSize
          const end = start + pagerConfig.pageSize
          const pageData = filteredItems.value.slice(start, end)
          
          resolve({
            result: pageData,
            total: filteredItems.value.length
          })
        })
      }
    }
  }
})
```

### 事件处理 (gridEvents)

```typescript
const gridEvents = {
  // 分页变化事件
  pageChange ({ currentPage, pageSize }: { currentPage: number, pageSize: number }) {
    console.log('分页变化:', currentPage, pageSize)
  },
  
  // 页面大小变化事件
  pagerChange ({ pageSize }: { pageSize: number }) {
    // 处理页面大小变化
  },
  
  // 单元格点击事件
  cellClick ({ row, column }: { row: any, column: any }) {
    console.log('点击了单元格', row, column)
  }
}
```

## 插槽使用

### 自定义列模板

使用插槽来自定义列的显示内容：

```vue
<template>
  <vxe-grid 
    ref="gridRef"
    v-bind="gridOptions"
    v-on="gridEvents">
    
    <!-- 自定义预览列 -->
    <template #thumbnail_default="{ row }">
      <div class="image-cell">
        <img 
          v-if="row.thumbnail" 
          :src="row.thumbnail" 
          class="thumbnail" 
          @error="handleImageError"
        />
        <div v-else class="no-preview">无预览</div>
      </div>
    </template>
    
    <!-- 自定义操作列 -->
    <template #actions_default="{ row }">
      <el-button size="small" @click.stop="saveItemChanges(row)">保存</el-button>
    </template>
  </vxe-grid>
</template>
```

### 项目中实际使用的插槽示例

```vue
<template>
  <vxe-grid 
    ref="gridRef"
    v-bind="gridOptions"
    v-on="gridEvents">
    
    <!-- 图片预览插槽 -->
    <template #thumbnail_default="{ row }">
      <div class="image-cell">
        <img 
          v-if="row.thumbnail" 
          :src="row.thumbnail" 
          class="thumbnail" 
          @error="handleImageError"
        />
        <div v-else class="no-preview">无预览</div>
      </div>
    </template>
    
    <!-- 名称列插槽 -->
    <template #name_default="{ row }">
      <span 
        class="editable-cell" 
        @dblclick="editCell(row, 'name')"
        :class="{ edited: isFieldEdited(row.id, 'name') }"
      >
        {{ row.name }}
      </span>
    </template>
    
    <!-- 文件夹列插槽 -->
    <template #folders_default="{ row }">
      <span 
        class="editable-cell" 
        @dblclick="editCell(row, 'folders')"
        :class="{ edited: isFieldEdited(row.id, 'folders') }"
      >
        {{ row.folders }}
      </span>
    </template>
    
    <!-- 标签列插槽 -->
    <template #tags_default="{ row }">
      <span 
        class="editable-cell" 
        @dblclick="editCell(row, 'tags')"
        :class="{ edited: isFieldEdited(row.id, 'tags') }"
      >
        {{ row.tags }}
      </span>
    </template>
    
    <!-- 注释列插槽 -->
    <template #annotation_default="{ row }">
      <span 
        class="editable-cell" 
        @dblclick="editCell(row, 'annotation')"
        :class="{ edited: isFieldEdited(row.id, 'annotation') }"
      >
        {{ row.annotation }}
      </span>
    </template>
    
    <!-- 操作列插槽 -->
    <template #actions_default="{ row }">
      <el-button size="small" @click.stop="saveItemChanges(row)">保存</el-button>
    </template>
  </vxe-grid>
</template>
```

## 数据代理 (proxyConfig)

数据代理是 vxe-table 的一个重要特性，它可以简化与服务端的数据交互，自动处理分页、排序、筛选等操作。

### 基本配置

```typescript
const gridOptions = reactive<VxeGridProps>({
  proxyConfig: {
    // 配置响应数据的字段名
    props: {
      result: 'result',   // 配置响应结果字段名
      total: 'total',     // 配置响应总数字段名
      message: 'message'  // 配置响应消息字段名（可选）
    },
    // 配置不同行为的请求方法
    ajax: {
      query: ({ page, sorts, filters, search }) => {
        // 查询方法，用于加载表格数据
        return new Promise(resolve => {
          // 发送请求到服务端
          fetchData({
            currentPage: page.currentPage,
            pageSize: page.pageSize
          }).then(response => {
            resolve(response)
          })
        })
      },
      queryAll: () => {
        // 查询所有数据（可选）
      },
      add: (params) => {
        // 添加数据（可选）
      },
      update: (params) => {
        // 更新数据（可选）
      },
      delete: (params) => {
        // 删除数据（可选）
      }
    }
  }
})
```

### 项目中实际使用的数据代理配置

```typescript
const gridOptions = reactive<VxeGridProps<Item>>({
  // ... 其他配置项
  
  proxyConfig: {
    props: {
      result: 'result',
      total: 'total'
    },
    ajax: {
      query: () => {
        return new Promise(resolve => {
          // 模拟分页数据
          const pagerConfig = gridOptions.pagerConfig
          const start = (pagerConfig.currentPage - 1) * pagerConfig.pageSize
          const end = start + pagerConfig.pageSize
          const pageData = filteredItems.value.slice(start, end)
          
          resolve({
            result: pageData,
            total: filteredItems.value.length
          })
        })
      }
    }
  }
})
```

### proxyConfig 工作原理

1. 当表格初始化或分页、排序、筛选等操作时，会自动调用 `proxyConfig.ajax.query` 方法
2. 方法需要返回一个 Promise 对象，该对象 resolve 后应包含数据列表和总数
3. 表格会根据 `proxyConfig.props` 中配置的字段名从响应数据中提取列表和总数
4. 表格会自动更新分页组件的状态

### 使用注意事项

1. `proxyConfig` 与 `pagerConfig` 配合使用效果最佳
2. 确保 `ajax.query` 返回的数据格式与 `props` 中配置的字段名一致
3. 如果使用服务端分页，需要在服务端处理分页逻辑
4. 可以通过 `beforeQuery` 和 `afterQuery` 钩子函数在查询前后执行额外操作

## 分页处理

### 客户端分页

```typescript
const gridOptions = reactive<VxeGridProps<Item>>({
  pagerConfig: {
    currentPage: 1,
    pageSize: 20,
    pageSizes: [10, 20, 50, 100, 200, 500]
  },
  proxyConfig: {
    response: {
      result: 'result',
      total: 'total'
    },
    ajax: {
      query: () => {
        // 模拟分页数据
        const pagerConfig = gridOptions.pagerConfig
        const start = (pagerConfig.currentPage - 1) * pagerConfig.pageSize
        const end = start + pagerConfig.pageSize
        const pageData = filteredItems.value.slice(start, end)
        
        return Promise.resolve({
          result: pageData,
          total: filteredItems.value.length
        })
      }
    }
  }
})
```

### 动态调整表格高度

```typescript
// 根据页面大小计算表格高度
const getTableHeight = () => {
  // 每行大约高度为60px，加上表头和一些边距
  const rowHeight = 60
  const headerHeight = 50
  const totalHeight = gridOptions.pagerConfig.pageSize * rowHeight + headerHeight
  
  // 设置最小和最大高度
  const minHeight = 500
  const maxHeight = 2000
  
  if (totalHeight < minHeight) return minHeight
  if (totalHeight > maxHeight) return maxHeight
  return totalHeight
}

// 监听pageSize变化，更新表格配置高度
watch(() => gridOptions.pagerConfig.pageSize, (newPageSize) => {
  gridOptions.height = getTableHeight()
})
```

## 最佳实践

### 1. 使用配置驱动而非模板

推荐使用 `v-bind="gridOptions"` 和 `v-on="gridEvents"` 的方式，而不是在模板中直接写大量属性。

### 2. 合理使用插槽

对于需要自定义渲染的列，使用插槽机制实现，保持代码清晰。

### 3. 数据代理配置

使用 `proxyConfig` 来处理服务端分页和数据加载，避免手动实现复杂的分页逻辑。

### 4. 性能优化

对于大量数据展示，应考虑启用虚拟滚动：

```typescript
const gridOptions = reactive<VxeGridProps<Item>>({
  scrollX: { enabled: true },
  scrollY: { enabled: true }
})
```

### 5. 响应式更新

使用 Vue 的响应式系统来管理表格配置，确保数据变化时表格能正确更新。

## 常见问题

### 1. 表格高度问题

避免设置 `height="100%"`，推荐使用固定高度或 `height="auto"` 并通过 CSS 控制容器高度。

### 2. 插槽不生效

确保插槽名称与列配置中的 `slots` 属性匹配，例如：

```typescript
// 列配置
{ field: 'name', title: '名称', slots: { default: 'name_default' } }

// 对应插槽
<template #name_default="{ row }">
  {{ row.name }}
</template>
```

### 3. 分页不工作

确保正确配置 `pagerConfig` 和 `proxyConfig`，并实现对应的 `ajax.query` 方法。

## 参考资源

- [Vxe-Table 官方文档](https://vxetable.cn)
- 项目中 TablePage.vue 文件的实现