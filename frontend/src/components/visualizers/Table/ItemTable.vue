<template>
  <vxe-grid 
    ref="gridRef"
    v-bind="gridOptions"
    v-on="gridEvents"
  >
    <!-- 预览列插槽 -->
    <template #thumbnail_default="{ row }">
      <div class="image-cell">
        <img 
          v-if="row.thumbnail" 
          :src="row.thumbnail" 
          class="thumbnail" 
          @error="handleImageError"
          @load="handleImageLoad"
        />
        <div v-else class="no-preview">无预览</div>
      </div>
    </template>
    
    <!-- 名称列插槽 -->
    <template #name_default="{ row }">
      <span class="cell-content">{{ row.name }}</span>
    </template>
    
    <!-- 文件夹列插槽 -->
    <template #folders_default="{ row }">
      <span class="cell-content">{{ formatArrayValue(row.folders) }}</span>
    </template>
    
    <!-- 标签列插槽 -->
    <template #tags_default="{ row }">
      <span class="cell-content">{{ formatArrayValue(row.tags) }}</span>
    </template>
    
    <!-- 注释列插槽 -->
    <template #annotation_default="{ row }">
      <span class="cell-content">{{ row.annotation }}</span>
    </template>
    
    <!-- 最后修改列插槽 -->
    <template #lastModified_default="{ row }">
      <span class="cell-content">{{ row.lastModified }}</span>
    </template>
  </vxe-grid>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import type { VxeGridInstance, VxeGridProps, VxeGridListeners, VxeGridPropTypes } from 'vxe-table'

// 定义数据类型
interface Item {
  id: string
  thumbnail: string
  name: string
  folders: string[] | string
  tags: string[] | string
  annotation: string
  lastModified: number | string
  url: string
}

// 定义属性
const props = defineProps<{
  items: any[] // Relaxed type to allow dynamic items
  loading: boolean
  columns?: any[] // Add columns prop
  pagerConfig?: VxeGridPropTypes.PagerConfig
  editConfig?: any
}>()

// 定义事件
const emit = defineEmits(['cell-click', 'edit-closed', 'edit-actived', 'add-row', 'add-column'])

const gridRef = ref<VxeGridInstance<Item>>()

// 表格配置
const gridOptions = reactive<VxeGridProps<Item>>({
  border: true,
  showOverflow: 'title',
  rowConfig: {
    isHover: true
  },
  height: '100%',
  keepSource: true,
  columns: (props.columns && props.columns.length > 0) ? props.columns : [
    { field: 'thumbnail', title: '预览', width: 100, slots: { default: 'thumbnail_default' } },
    { 
      field: 'name', 
      title: '名称', 
      width: 200, 
      slots: { default: 'name_default' },
      editRender: { name: 'input' }
    },
    { 
      field: 'folders', 
      title: '文件夹', 
      width: 150, 
      slots: { default: 'folders_default' },
      editRender: { name: 'input' }
    },
    { 
      field: 'tags', 
      title: '标签', 
      width: 200, 
      slots: { default: 'tags_default' },
      editRender: { name: 'input' }
    },
    { 
      field: 'annotation', 
      title: '注释', 
      width: 300, 
      slots: { default: 'annotation_default' },
      editRender: { name: 'input' }
    },
    { 
      field: 'lastModified', 
      title: '最后修改', 
      width: 180, 
      slots: { default: 'lastModified_default' },
      editRender: { name: 'input' }
    }
  ],
  pagerConfig: props.pagerConfig,
  editConfig: props.editConfig,
  proxyConfig: {
    response: {
      result: 'result',
      total: 'total'
    },
    ajax: {
      query: ({ page }) => {
        return new Promise(resolve => {
          const { currentPage, pageSize } = page
          const startIndex = (currentPage - 1) * pageSize
          const endIndex = startIndex + pageSize
          const currentPageData = props.items.slice(startIndex, endIndex)
          
          resolve({
            result: currentPageData,
            total: props.items.length
          })
        })
      }
    }
  },
  // Context menu config
  menuConfig: {
    body: {
      options: [
        [
          { code: 'insertRow', name: '新增行', prefixIcon: 'vxe-icon-add' },
          { code: 'insertColumn', name: '新增列', prefixIcon: 'vxe-icon-add-column' }
        ]
      ]
    }
  }
})

// 事件处理
const gridEvents: VxeGridListeners<Item> = {
  cellClick({ row }) {
    emit('cell-click', { row })
  },
  editClosed(params) {
    emit('edit-closed', params)
  },
  editActived(params) {
    emit('edit-actived', params)
  },
  menuClick({ menu, row, column }) {
    switch (menu.code) {
      case 'insertRow':
        handleAddRow()
        break
      case 'insertColumn':
        handleAddColumn()
        break
    }
  }
}

// 新增行
const handleAddRow = () => {
  const newRow: any = {
    id: `new_${Date.now()}`,
    thumbnail: '',
    name: '新项目',
    folders: [],
    tags: [],
    annotation: '',
    lastModified: Date.now(),
    url: '',
    data: {}
  }
  
  // Initialize data fields based on columns
  if (props.columns) {
      props.columns.forEach(col => {
          if (col.field.startsWith('data.')) {
              const key = col.field.split('.')[1];
              newRow.data[key] = '';
          }
      });
  }
  
  // Emit event to parent to add row
  emit('add-row', newRow)
}

// 新增列
const handleAddColumn = () => {
  const columnName = prompt('请输入列名')
  if (columnName) {
    // Emit event to parent to add column
    emit('add-column', columnName)
  }
}

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  console.log('[ITEM_TABLE] 图片加载失败:', target.src);
  if (target && target.parentElement) {
    target.style.display = 'none'
    target.parentElement.innerHTML = '<div class="no-preview">无预览</div>'
  }
}

// 处理图片加载成功
const handleImageLoad = (event: Event) => {
  const target = event.target as HTMLImageElement
  console.log('[ITEM_TABLE] 图片加载成功:', target.src);
}

// 格式化数组值显示
const formatArrayValue = (value: string[] | string | undefined): string => {
  if (!value) return ''
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  return value
}

// 监听pagerConfig变化
watch(() => props.pagerConfig, (newVal) => {
  if (newVal) {
    gridOptions.pagerConfig = newVal
  }
})

// 监听editConfig变化
watch(() => props.editConfig, (newVal) => {
  if (newVal) {
    gridOptions.editConfig = newVal
  }
})

// 监听columns变化
watch(() => props.columns, (newVal) => {
  console.log('[ItemTable] columns changed:', newVal?.length)
  if (newVal && newVal.length > 0) {
    gridOptions.columns = newVal
    if (gridRef.value) {
      console.log('[ItemTable] reloading columns')
      gridRef.value.reloadColumn(newVal)
    }
  }
}, { deep: true })

// 监听items变化
watch(() => props.items, (newVal) => {
  if (gridRef.value) {
    // 使用 reloadData 直接加载数据，比 commitProxy 更直接
    gridRef.value.reloadData(newVal)
    // 重新计算布局，防止表格不显示
    gridRef.value.recalculate()
  }
}, { deep: true })

// 组件挂载时加载数据
onMounted(() => {
  if (props.items && props.items.length > 0 && gridRef.value) {
    gridRef.value.reloadData(props.items)
  }
})

// 定义暴露给父组件的方法
defineExpose({
  gridRef
})
</script>

<style scoped>
/* 表格主体样式 */
.vxe-table--body-wrapper {
  /* 确保表格内容可以垂直滚动 */
  overflow: auto;
}

/* 图片单元格样式 */
.image-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 50px;
}

.thumbnail {
  max-width: 80px;
  max-height: 80px;
  object-fit: contain;
  border-radius: 4px;
}

.no-preview {
  color: #999;
  font-size: 12px;
  text-align: center;
}

/* 单元格内容样式 */
.cell-content {
  display: block;
  padding: 8px 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 表头样式 */
.vxe-header--column .vxe-cell--title {
  background-color: #fafafa;
  font-weight: bold;
  padding: 10px 0;
  text-align: left;
}

/* 表格内容样式 */
.vxe-body--column .vxe-cell {
  height: 50px;
  line-height: 50px;
  font-size: 13px;
  color: #666;
  padding: 0 16px;
}

/* 编辑状态样式 */
.vxe-table--body .vxe-cell--highlight {
  background-color: #fffbe6;
}
</style>