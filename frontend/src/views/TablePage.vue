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
import ItemTable from '../components/ItemTable.vue'
import DetailPanel from '../components/DetailPanel.vue'
import { useItems } from '../services/useItems'
import { useSearch } from '../services/useSearch'
import { usePagination } from '../services/usePagination'

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
  items, 
  loading, 
  error, 
  editedItems, 
  refreshData, 
  saveItemChanges, 
  setCommunication 
} = useItems()

const { 
  searchText, 
  filteredItems, 
  handleSearchClear 
} = useSearch(items)

const { 
  gridOptions: pagerConfig, 
  getTableHeight
} = usePagination()

// 表格引用
const tableRef = ref()

// 选中行
const selectedRow = ref<Item | null>(null)

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

// 组件挂载时加载数据
onMounted(() => {
  refreshData()
  setCommunication()
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