<template>
    <div class="table-page">
      <div class="table-container">
        <!-- 表格区域 -->
        <ItemTable
          ref="tableRef"
          :items="filteredItems"
          :loading="loading"
          :pager-config="pagerConfig"
          :edit-config="editConfig"
          @cell-click="handleCellClick"
          @edit-closed="handleEditClosed"
          @edit-actived="handleEditActived"
        />
        
        <!-- 右侧详情面板 -->
        <DetailPanel
          :selected-row="selectedRow"
          @field-update="updateSelectedRowField"
        />
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router'
import ItemTable from '../components/table/ItemTable.vue'
import DetailPanel from '../components/table/DetailPanel.vue'
import { useItems } from '../services/useItems'
import { useSearch } from '../services/useSearch'
import { usePagination } from '../services/usePagination'
import { getUploadedItems, getUploadedLibraryInfo } from '../services/uploadedItemsService'

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

// 使用composables
const { 
  items: eagleItems, 
  loading: eagleLoading, 
  error, 
  editedItems, 
  refreshData: refreshEagleData, 
  saveItemChanges, 
  setCommunication 
} = useItems()

const { 
  searchText, 
  filteredItems: eagleFilteredItems, 
  handleSearchClear 
} = useSearch(eagleItems)

const { 
  gridOptions: pagerConfig, 
  getTableHeight
} = usePagination()

// 上传数据相关的状态
const uploadedItems = ref<Item[]>([])
const loading = ref(false)

// 合并过滤后的项目（来自上传或Eagle）
const filteredItems = computed(() => {
  // 如果有上传的项目，使用上传的项目；否则使用Eagle项目
  return sourceType.value === 'upload' ? uploadedItems.value : eagleFilteredItems.value
})

const route = useRoute()
const router = useRouter()

// 表格引用
const tableRef = ref()

// 选中行
const selectedRow = ref<Item | null>(null)

// 数据源类型
const sourceType = ref<'upload' | 'eagle' | null>(null)

// 编辑配置
const editConfig: any = {
  trigger: 'click',
  mode: 'cell',
  showStatus: true,
  keepSource: true
}

// 处理单元格点击
const handleCellClick = ({ row }: { row: Item }) => {
  selectedRow.value = { ...row }
}

// 处理编辑关闭
const handleEditClosed = (params: any) => {
  // 创建更新后的行数据
  const updatedRow = { ...params.row, [params.column.field]: params.value }
  saveItemChanges(updatedRow)
}

// 处理编辑激活
const handleEditActived = (params: any) => {
  console.log('编辑激活', params.row, params.column)
}

// 处理页面变化
const handlePageChange: any = ({ currentPage, pageSize }: { currentPage: number; pageSize: number }) => {
  pagerConfig.value.currentPage = currentPage
  pagerConfig.value.pageSize = pageSize
}

// 处理搜索文本更新
const handleSearchTextUpdate = (value: string) => {
  // 重置到第一页
  pagerConfig.value.currentPage = 1
}

// 添加更新选中行字段的方法
const updateSelectedRowField = (field: string, event: Event) => {
  if (!selectedRow.value) return;
  
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  const value = target.value;
  
  // 创建新的对象以触发响应式更新
  selectedRow.value = {
    ...selectedRow.value,
    [field]: value
  };
};

// 获取上传的数据
const loadUploadedData = async () => {
  loading.value = true
  try {
    // 从后端获取上传的数据
    const itemsData = await getUploadedItems()
    uploadedItems.value = itemsData || []
    
    console.log('[TablePage] 成功加载上传的数据，项目数量:', uploadedItems.value.length)
  } catch (err) {
    console.error('[TablePage] 加载上传数据失败:', err)
  } finally {
    loading.value = false
  }
}

// 根据数据源加载数据
const loadDataBySource = async (source: string) => {
  sourceType.value = source as 'upload' | 'eagle'
  
  switch (source) {
    case 'upload':
      // 从后端获取上传的数据
      await loadUploadedData()
      break
    case 'eagle':
      // 从Eagle插件获取数据
      await refreshEagleData()
      break
    default:
      // 默认情况不加载数据
      break
  }
}

// 组件挂载时根据路由参数加载数据
onMounted(async () => {
  setCommunication()
  
  // 获取数据源参数
  const source = route.query.source as string
  if (source) {
    await loadDataBySource(source)
  }
})

// 路由更新时重新加载数据
onBeforeRouteUpdate(async (to, from) => {
  const source = to.query.source as string
  if (source) {
    await loadDataBySource(source)
  }
})
</script>

<style scoped>
.table-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  overflow: hidden;
}

.table-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>