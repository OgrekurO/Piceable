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
import { ref, reactive, watch } from 'vue'
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
  items: Item[]
  loading: boolean
  pagerConfig?: VxeGridPropTypes.PagerConfig
  editConfig?: any
}>()

// 定义事件
const emit = defineEmits(['cell-click', 'edit-closed', 'edit-actived'])

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
  columns: [
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
  }
}

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  if (target && target.parentElement) {
    target.style.display = 'none'
    target.parentElement.innerHTML = '<div class="no-preview">无预览</div>'
  }
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

// 定义暴露给父组件的方法
defineExpose({
  gridRef
})
</script>

<style scoped>
/* 表格主体样式 */
.vxe-table--body-wrapper {
  border-spacing: 0;
  border-collapse: collapse;
}

/* 表格行样式 */
.vxe-body--row {
  margin: 0;
  padding: 0;
  border-bottom: 1px solid #ddd;
}

/* 第一行添加顶部边框 */
.vxe-body--row:first-child {
  border-top: 1px solid #ddd;
}

/* 禁用表格行选中时的蓝色背景 */
.vxe-body--row.row--selected {
  background-color: transparent !important;
}

.vxe-body--row.row--hover {
  background-color: transparent !important;
}

/* 表格单元格样式 */
.vxe-body--column {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  border-right: 1px solid #ddd;
  margin: 0;
  padding: 0;
  height: 50px; /* 固定行高 */
  line-height: 50px; /* 垂直居中 */
}

/* 移除最后一列的右边框 */
.vxe-body--column:last-child {
  border-right: none;
}

/* 表头单元格样式 */
.vxe-header--column {
  border-right: none;
  border-bottom: 1px solid #ddd;
  background-color: #fafafa; /* 表头背景色 */
  font-weight: bold; /* 表头字体加粗 */
  padding: 10px 0; /* 表头内边距 */
  text-align: left; /* 表头文字左对齐 */
}

/* 表头区域样式 */
.vxe-table--header-wrapper {
  border-bottom: 1px solid #ddd;
}

/* 单独控制表头文字样式 */
.vxe-header--column .vxe-cell--title {
  font-size: 14px;
  color: #333;
  padding-left: 16px;
}

/* 单独控制表格内容文字样式 */
.vxe-body--column .vxe-cell {
  font-size: 13px;
  color: #666;
  padding: 0 16px;
  line-height: 50px; /* 与单元格高度一致以垂直居中 */
}

.image-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
}

.thumbnail {
  max-width: 80px;
  max-height: 40px;
  object-fit: contain;
}

.no-preview {
  color: #999;
  font-size: 12px;
}

.cell-content {
  display: block;
  height: 50px;
  line-height: 50px;
  padding: 0 16px;
}
</style>