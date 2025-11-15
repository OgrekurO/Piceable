 <template>
  <MainLayout>
    <div class="table-page">

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-loading="loading" class="table-container">
        <vxe-grid 
          ref="gridRef"
          v-bind="gridOptions"
          v-on="gridEvents"
        >
          <template #toolbarButtons>
            <span>数据：</span>
            <vxe-select 
              v-model="gridOptions.pagerConfig.pageSize" 
              :options="gridOptions.pagerConfig.pageSizes.map(size => ({ label: `显示${size}条/页`, value: size }))">
            </vxe-select>
          </template>
          
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
          
          <template #name_default="{ row }">
            <span 
              class="editable-cell" 
              @dblclick="editCell(row, 'name')"
              :class="{ edited: isFieldEdited(row.id, 'name') }"
            >
              {{ row.name }}
            </span>
          </template>
          
          <template #folders_default="{ row }">
            <span 
              class="editable-cell" 
              @dblclick="editCell(row, 'folders')"
              :class="{ edited: isFieldEdited(row.id, 'folders') }"
            >
              {{ row.folders }}
            </span>
          </template>
          
          <template #tags_default="{ row }">
            <span 
              class="editable-cell" 
              @dblclick="editCell(row, 'tags')"
              :class="{ edited: isFieldEdited(row.id, 'tags') }"
            >
              {{ row.tags }}
            </span>
          </template>
          
          <template #annotation_default="{ row }">
            <span 
              class="editable-cell" 
              @dblclick="editCell(row, 'annotation')"
              :class="{ edited: isFieldEdited(row.id, 'annotation') }"
            >
              {{ row.annotation }}
            </span>
          </template>

        </vxe-grid>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, reactive, nextTick } from 'vue'
import { 
  getItems, 
  updateItem, 
  getLibraryInfo,
  CommunicationMethod,
  setCommunicationMethod
} from '../services/pluginCommunication'
import type { EagleItem, LibraryInfo as PluginLibraryInfo } from '../services/pluginCommunication'
import MainLayout from '../layouts/MainLayout.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 引入 Vxe-Table 和 Vxe-UI
import 'vxe-table/lib/style.css'
import 'vxe-pc-ui/lib/style.css'
import { VXETable, VxeGrid, VxeGridInstance, VxeGridProps } from 'vxe-table'
import * as VxeUI from 'vxe-pc-ui'

// 注册VxeUI组件
VXETable.use(VxeGrid)
VxeUI.VxeUI.component(VxeUI.VxeButton)
VxeUI.VxeUI.component(VxeUI.VxeTooltip)
VxeUI.VxeUI.component(VxeUI.VxePager)
VxeUI.VxeUI.component(VxeUI.VxeSelect)

// 定义数据类型
interface Item {
  id: string
  name: string
  folders: string[] | string
  tags: string[] | string
  annotation: string
  lastModified: number | string
  thumbnail?: string
  url: string
}

interface LibraryInfo {
  name: string
  itemsCount: number
}

interface LibraryResponse {
  libraryInfo: PluginLibraryInfo
  folderMap: Record<string, string>
  folderIdMap: Record<string, string>
}

// 定义响应类型
interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  count?: number
}

const gridRef = ref<VxeGridInstance<Item>>()

const items = ref<Item[]>([])
const libraryInfo = ref<LibraryInfo | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const searchText = ref('')

// 存储修改过的项目
const editedItems = ref<Record<string, Partial<Item>>>({})

// 计算过滤后的项目
const filteredItems = computed(() => {
  // 确保items.value是一个数组
  if (!Array.isArray(items.value)) {
    console.log('[DEBUG] items.value不是数组:', items.value); // 调试日志
    return []
  }
  
  console.log('[DEBUG] 原始项目数量:', items.value.length); // 调试日志
  
  let result = items.value
  
  // 应用搜索过滤
  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase()
    result = result.filter(item => 
      (item.name && item.name.toLowerCase().includes(searchLower)) ||
      (item.folders && (Array.isArray(item.folders) ? item.folders.join(', ') : item.folders.toString()).toLowerCase().includes(searchLower)) ||
      (item.tags && (Array.isArray(item.tags) ? item.tags.join(', ') : item.tags.toString()).toLowerCase().includes(searchLower)) ||
      (item.annotation && item.annotation.toLowerCase().includes(searchLower))
    )
  }
  
  console.log('[DEBUG] 过滤后项目数量:', result.length); // 调试日志
  
  return result
})

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
  ],
  pagerConfig: {
    currentPage: 1,
    pageSize: 20,
    pageSizes: [10, 20, 50, 100, 200, 500]
  },
  toolbarConfig: {
    refresh: true,
    custom: true
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

const gridEvents = {
  pageChange ({ currentPage, pageSize }: { currentPage: number, pageSize: number }) {
    console.log('分页变化:', currentPage, pageSize)
    gridOptions.pagerConfig.currentPage = currentPage
    gridOptions.pagerConfig.pageSize = pageSize
  },
  pagerChange ({ pageSize }: { pageSize: number }) {
    gridOptions.pagerConfig.pageSize = pageSize
    gridOptions.height = getTableHeight()
  }
}

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

// 刷新数据
const refreshData = async () => {
  loading.value = true
  error.value = null
  
  try {
    // 获取项目列表
    const itemsData = await getItems()
    console.log('[DEBUG] API响应:', itemsData); // 调试日志
    
    if (itemsData) {
      // 清空现有数据
      items.value = []
      
      // 确保数据是数组
      const data = Array.isArray(itemsData) ? itemsData : []
      
      // 处理每个项目
      data.forEach(item => {
        // 创建新的Item对象
        const newItem: Item = {
          id: item.id,
          name: item.name,
          url: item.url || '',
          thumbnail: item.thumbnail || '', // 缩略图字段应该直接使用thumbnail
          folders: item.folders || '',
          tags: item.tags || '',
          annotation: item.annotation || '',
          lastModified: item.lastModified || ''
        }
        
        // 添加到items数组
        items.value.push(newItem)
      })
      
      console.log('[DEBUG] 处理后的项目数据:', items.value); // 调试日志
    } else {
      items.value = []
    }
    
    // 获取库信息
    const libraryData = await getLibraryInfo()
    if (libraryData) {
      libraryInfo.value = {
        name: libraryData.name,
        itemsCount: libraryData.itemsCount || itemsData?.length || 0
      }
    }
    
    ElMessage.success('数据刷新成功')
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取数据失败'
    console.error('刷新数据失败:', err)
    ElMessage.error('数据刷新失败: ' + (err instanceof Error ? err.message : '未知错误'))
  } finally {
    loading.value = false
  }
}

// 导出数据
const exportData = () => {
  ElMessageBox.alert('导出功能将在后续版本中实现', '提示', {
    confirmButtonText: '确定'
  })
}

// 编辑单元格
const editCell = (row: Item, field: string) => {
  ElMessageBox.prompt(`编辑 ${field}`, '编辑', {
    inputValue: row[field as keyof Item] as string,
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(({ value }: {value: string}) => {
    // 初始化编辑记录
    if (!editedItems.value[row.id]) {
      editedItems.value[row.id] = {}
    }
    
    // 记录修改
    const editedItem = editedItems.value[row.id]
    if (editedItem) {
      editedItem[field as keyof Item] = value
    }
    
    // 更新显示数据
    const itemIndex = items.value.findIndex(item => item.id === row.id)
    if (itemIndex !== -1) {
      const updatedItem = { ...items.value[itemIndex] } as Item
      updatedItem[field as keyof Item] = value as never
      items.value[itemIndex] = updatedItem
    }
    
    ElMessage.success(`${field} 已更新`)
  }).catch(() => {
    // 用户取消编辑
  })
}

// 检查字段是否被编辑
const isFieldEdited = (itemId: string, field: string) => {
  const item = editedItems.value[itemId]
  return item && item[field as keyof Item] !== undefined
}

// 保存项目更改
const saveItemChanges = async (row: Item) => {
  if (!editedItems.value[row.id]) {
    ElMessage.info('没有需要保存的更改')
    return
  }
  
  try {
    const changes = editedItems.value[row.id]
    if (changes) {
      const itemToUpdate: Partial<EagleItem> & {id: string} = { 
        id: row.id
      }
      
      // 添加可能的更改字段
      if (changes.name !== undefined) itemToUpdate.name = changes.name as string
      if (changes.annotation !== undefined) itemToUpdate.annotation = changes.annotation as string
      if (changes.folders !== undefined) {
        const folders = changes.folders
        if (typeof folders === 'string') {
          itemToUpdate.folders = folders.split(',').map((f: string) => f.trim()).filter((f: string) => f)
        } else {
          itemToUpdate.folders = folders as string[]
        }
      }
      if (changes.tags !== undefined) {
        const tags = changes.tags
        if (typeof tags === 'string') {
          itemToUpdate.tags = tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
        } else {
          itemToUpdate.tags = tags as string[]
        }
      }
      
      await updateItem(itemToUpdate as EagleItem)
      delete editedItems.value[row.id]
      ElMessage.success('更改已保存')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '保存失败'
    console.error('保存项目失败:', err)
    ElMessage.error('保存项目失败: ' + (err instanceof Error ? err.message : '未知错误'))
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

// 组件挂载时加载数据
onMounted(() => {
  refreshData()
  
  // 设置默认通信方式为HTTP API
  setCommunicationMethod(CommunicationMethod.HttpApi)
  
  // 初始化表格高度
  gridOptions.height = getTableHeight()
})


</script>

<style scoped>
.table-page {
  padding: 20px;
  height: auto;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.controls {
  display: flex;
  gap: 10px;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.table-container {
  flex: 1;
  overflow: visible;
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.image-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 60px;
  overflow: hidden;
}

.thumbnail {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  width: auto;
  height: auto;
}

.no-preview {
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  text-align: center;
}

.editable-cell {
  cursor: pointer;
  padding: 4px;
  border-radius: 2px;
}

.editable-cell:hover {
  background-color: #f0f0f0;
}

.editable-cell.edited {
  background-color: #e8f4fd;
  border: 1px dashed #409eff;
}
</style>