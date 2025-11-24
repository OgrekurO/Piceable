<template>
  <div class="table-page">
    <!-- 表格标签页组件 -->
    <TableTabs
      :tables="tables"
      :current-table-id="currentTableId"
      @switch="handleSwitchTable"
      @add="showCreateTableDialog = true"
    />

    <div class="table-container">
      <!-- 表格区域 -->
      <ItemTable
        ref="tableRef"
        :items="currentData"
        :loading="currentLoading"
        :columns="dynamicColumns"
        :pager-config="pagerConfig"
        :edit-config="editConfig"
        @cell-click="handleCellClick"
        @edit-closed="handleEditClosed"
        @edit-actived="handleEditActived"
        @add-row="handleAddRow"
        @add-column="handleAddColumn"
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
import { ref, onMounted } from 'vue'
import { useRoute, onBeforeRouteUpdate } from 'vue-router'

// Components
import ItemTable from '@/components/visualizers/Table/ItemTable.vue'
import DetailPanel from '@/components/visualizers/Table/DetailPanel.vue'
import TableTabs from '@/components/visualizers/Table/TableTabs.vue'

// Composables - Business
import { useItems } from '@/composables/business/useItems'
import { useSearch } from '@/composables/business/useSearch'
import { usePagination } from '@/composables/business/usePagination'
import { useProjectData } from '@/composables/business/useProjectData'
import { useUnifiedDataSource } from '@/composables/business/useUnifiedDataSource'

// Composables - Table
import { useTableManagement } from '@/composables/table/useTableManagement'
import { useTableRowEdit } from '@/composables/table/useTableRowEdit'
import { useTableColumns } from '@/composables/table/useTableColumns'

const route = useRoute()

// ========== Eagle 数据 ==========
const { 
  items: eagleItems, 
  loading: eagleLoading, 
  refreshData: refreshEagleData, 
  setCommunication 
} = useItems()

const { filteredItems: eagleFilteredItems } = useSearch(eagleItems)
const { gridOptions: pagerConfig } = usePagination()

// ========== 项目数据 ==========
const { currentProjectId, loadProject } = useProjectData()

// ========== 表格管理 ==========
const {
  tables,
  currentTableId,
  currentTableData,
  currentTableSchema,
  loading: tableLoading,
  loadTables,
  switchTable
} = useTableManagement()

// ========== 统一数据源 ==========
const {
  currentData,
  currentLoading,
  isEagleSource,
  switchSource
} = useUnifiedDataSource(
  eagleFilteredItems,
  currentTableData,
  eagleLoading,
  tableLoading
)

// ========== 行编辑 (传入 tableData 以支持自动同步) ==========
const {
  selectedRow,
  handleCellClick,
  updateSelectedRowField,
  saveAndSync
} = useTableRowEdit(currentProjectId, currentTableId, currentTableData)

// ========== 列管理 ==========
const {
  dynamicColumns,
  generateColumnsFromSchema,
  addColumn
} = useTableColumns()

// ========== 本地状态 ==========
const tableRef = ref()
const showCreateTableDialog = ref(false)

// ========== 编辑配置 ==========
const editConfig = {
  trigger: 'click',
  mode: 'cell',
  showStatus: true,
  keepSource: true
}

// ========== 事件处理 ==========

/**
 * 切换表格
 */
const handleSwitchTable = async (tableId: number) => {
  if (!currentProjectId.value) return
  
  await switchTable(tableId, currentProjectId.value)
  generateColumnsFromSchema(currentTableSchema.value)
  
  // 强制刷新表格
  tableRef.value?.gridRef?.reloadColumn(dynamicColumns.value)
  tableRef.value?.gridRef?.reloadData(currentTableData.value)
}

/**
 * 加载项目数据
 */
const loadProjectData = async (projectId: number) => {
  try {
    await loadProject(projectId)
    await loadTables(projectId)
    
    // 选择默认表格
    if (tables.value.length > 0) {
      const routeTableId = route.query.tableId 
        ? parseInt(route.query.tableId as string) 
        : null
      const targetTable = routeTableId 
        ? tables.value.find(t => t.id === routeTableId) 
        : tables.value[0]
      
      if (targetTable) {
        await handleSwitchTable(targetTable.id)
      }
    }
  } catch (err) {
    console.error('[TablePage] 加载项目数据失败:', err)
  }
}

/**
 * 处理编辑关闭 (逻辑已下沉到 composable)
 */
const handleEditClosed = async (params: any) => {
  try {
    await saveAndSync(params.row)
  } catch (error) {
    console.error('[TablePage] 保存失败:', error)
    alert('保存失败，请重试')
  }
}

/**
 * 处理编辑激活
 */
const handleEditActived = (params: any) => {
  console.log('[TablePage] 编辑激活', params.row, params.column)
}

/**
 * 处理新增行
 */
const handleAddRow = (newRow: any) => {
  currentTableData.value.push(newRow)
}

/**
 * 处理新增列
 */
const handleAddColumn = (columnName: string) => {
  try {
    addColumn(columnName)
    // TODO: 更新Schema并保存到后端
  } catch (error: any) {
    alert(error.message)
  }
}

/**
 * 根据数据源加载数据 (使用统一数据源适配器)
 */
const loadDataBySource = async (source: string, projectId?: string) => {
  // 切换数据源
  switchSource({ 
    type: source as any, 
    projectId: projectId ? parseInt(projectId) : undefined 
  })
  
  if (projectId) {
    currentProjectId.value = parseInt(projectId)
  }

  // 根据数据源类型加载数据
  if (isEagleSource.value) {
    await refreshEagleData()
    dynamicColumns.value = []
  } else {
    if (currentProjectId.value) {
      await loadProjectData(currentProjectId.value)
    }
  }
}

// ========== 生命周期 ==========

onMounted(async () => {
  console.log('[TablePage] 组件挂载', route.fullPath)
  setCommunication()
  
  const source = route.query.source as string
  const projectId = route.query.projectId as string
  
  if (source) {
    await loadDataBySource(source, projectId)
  }
})

onBeforeRouteUpdate(async (to, from) => {
  const source = to.query.source as string
  const projectId = to.query.projectId as string
  
  if (source !== from.query.source || projectId !== from.query.projectId) {
    await loadDataBySource(source, projectId)
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
  gap: 0;
}

.table-container > :first-child {
  flex: 0 0 80%;
  width: 80%;
  overflow: auto;
}

.table-container > :last-child {
  flex: 0 0 20%;
  width: 20%;
  overflow-y: auto;
}
</style>