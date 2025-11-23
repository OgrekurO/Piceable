<template>
    <div class="table-page">
      <!-- 表格标签页 -->
      <div class="table-tabs" v-if="tables.length > 0">
        <div 
          v-for="table in tables" 
          :key="table.id" 
          class="tab-item"
          :class="{ active: currentTableId === table.id }"
          @click="switchTable(table.id)"
        >
          {{ table.name }}
        </div>
        <div class="tab-add" @click="showCreateTableDialog = true">
          +
        </div>
      </div>

      <div class="table-container">
        <!-- 表格区域 -->
        <ItemTable
          ref="tableRef"
          :items="filteredItems"
          :loading="loading"
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
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router'
import ItemTable from '../components/table/ItemTable.vue'
import DetailPanel from '../components/table/DetailPanel.vue'
import { useItems } from '../services/useItems'
import { useSearch } from '../services/useSearch'
import { usePagination } from '../services/usePagination'
import { getUploadedItems } from '../services/uploadedItemsService'
import { getProject } from '../services/projectService'
import { getTables, createTable } from '../services/tableService'
import { getAccessToken } from '../services/authService'
import type { ProjectSchema, Table } from '../types/schema'

// 定义数据类型
interface Item {
  id: string
  thumbnail?: string
  name?: string
  folders?: string[] | string
  tags?: string[] | string
  annotation?: string
  lastModified?: number | string
  url?: string
  data?: any
  [key: string]: any // Allow dynamic properties
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

// 上传/项目数据相关的状态
const projectItems = ref<Item[]>([])
const loading = ref(false)
const currentProjectSchema = ref<ProjectSchema | null>(null)
const dynamicColumns = ref<any[]>([])
const tables = ref<Table[]>([])
const currentTableId = ref<number | null>(null)
const showCreateTableDialog = ref(false)

// 合并过滤后的项目（来自上传或Eagle）
const filteredItems = computed(() => {
  // 如果有上传的项目，使用上传的项目；否则使用Eagle项目
  return (sourceType.value === 'upload' || sourceType.value === 'manual') ? projectItems.value : eagleFilteredItems.value
})

const route = useRoute()
const router = useRouter()

// 表格引用
const tableRef = ref()

// 选中行
const selectedRow = ref<Item | null>(null)

// 数据源类型
const sourceType = ref<'upload' | 'eagle' | 'manual' | null>(null)
const currentProjectId = ref<number | null>(null)

// 切换表格
const switchTable = async (tableId: number) => {
  if (currentTableId.value === tableId) return
  currentTableId.value = tableId
  
  // 更新路由参数 (可选，如果想记录当前选中的表)
  // router.replace({ query: { ...route.query, tableId: tableId.toString() } })
  
  await loadTableData(tableId)
}

// 加载表格数据
const loadTableData = async (tableId: number) => {
  if (!currentProjectId.value) return
  
  loading.value = true
  try {
    // 1. 获取表格详情（主要是 schema）
    const table = tables.value.find(t => t.id === tableId)
    
    let schema = table?.schema
    
    // 如果是关系表且没有schema，使用默认schema
    if (!schema && (table?.name === 'Relationships' || table?.name === '关系')) {
      schema = {
        fields: [
          { key: 'From', label: '源节点', type: 'text' as any },
          { key: 'To', label: '目标节点', type: 'text' as any },
          { key: 'Direction', label: '方向', type: 'select' as any, options: ['directed', 'undirected'] },
          { key: 'Label', label: '标签', type: 'text' as any },
          { key: 'Type', label: '类型', type: 'text' as any },
          { key: 'Tags', label: '标签', type: 'multi_select' as any },
          { key: 'Description', label: '描述', type: 'text' as any },
          { key: 'Image', label: '图片', type: 'image' as any }
        ]
      }
    }
    
    if (schema) {
      currentProjectSchema.value = schema
      
      // 更新列配置
      dynamicColumns.value = schema.fields.map(field => ({
        field: `data.${field.key}`,
        title: field.label,
        width: 150,
        editRender: { name: 'input' } // 简单起见，都用 input
      }))
    } else {
      currentProjectSchema.value = null
      dynamicColumns.value = []
    }
    
    // 2. 获取表格数据
    const items = await getUploadedItems(currentProjectId.value, tableId)
    projectItems.value = items || []
    
    console.log(`[TablePage] 已加载表格 ${table?.name} (ID: ${tableId}) 的数据，共 ${items.length} 项`)
    
    // 强制刷新表格
    if (tableRef.value && tableRef.value.gridRef) {
      tableRef.value.gridRef.reloadColumn(dynamicColumns.value)
      tableRef.value.gridRef.reloadData(projectItems.value)
    }
    
  } catch (error) {
    console.error('加载表格数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载项目数据（入口）
const loadProjectData = async (projectId: number) => {
  loading.value = true
  try {
    // 1. 获取项目信息
    const project = await getProject(projectId)
    console.log('[TablePage] 加载项目:', project.name)
    
    // 2. 获取项目下的所有表格
    tables.value = await getTables(projectId)
    console.log('[TablePage] 获取到表格:', tables.value)
    
    if (tables.value.length > 0) {
      // 默认选中第一个表格
      // 如果路由中有 tableId，优先使用
      const routeTableId = route.query.tableId ? parseInt(route.query.tableId as string) : null
      const targetTable = routeTableId ? tables.value.find(t => t.id === routeTableId) : tables.value[0]
      
      if (targetTable) {
        await switchTable(targetTable.id)
      }
    } else {
      // 如果没有表格（可能是旧项目迁移前？或者新建空项目），显示空状态或引导创建
      projectItems.value = []
      dynamicColumns.value = []
    }
    
  } catch (err: any) {
    console.error('[TablePage] 加载项目数据失败:', err)
    if (err.message && err.message.includes('401')) {
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

// 编辑配置
const editConfig: any = {
  trigger: 'click',
  mode: 'cell',
  showStatus: true,
  keepSource: true
}

// 处理单元格点击
const handleCellClick = ({ row }: { row: Item }) => {
  console.log('[TablePage] 单元格点击，选中行:', row)
  // 深拷贝行数据以避免直接修改原始数据
  selectedRow.value = JSON.parse(JSON.stringify(row))
}

// 处理编辑关闭
const handleEditClosed = async (params: any) => {
  try {
    // 获取编辑后的值
    const field = params.column.field
    const row = params.row
    
    // 从 field 中提取实际的字段名（去掉 'data.' 前缀）
    const fieldKey = field.startsWith('data.') ? field.substring(5) : field
    
    // 从 row.data 中获取实际的值（编辑后的值已经在 row.data 中了）
    const value = row.data ? row.data[fieldKey] : row[fieldKey]
    
    console.log('[TablePage] 编辑关闭:', { field, fieldKey, value, rowId: row.id, rowData: row.data })
    
    // 检查是否是新行（ID 以 'new_' 开头）
    const isNewRow = row.id.startsWith('new_')
    
    if (isNewRow) {
      // 新行：更新本地数据，并保存到数据库
      console.log('[TablePage] 新行编辑，保存到数据库')
      
      // 更新本地数据
      const itemIndex = projectItems.value.findIndex(item => item.id === row.id)
      if (itemIndex !== -1) {
        projectItems.value[itemIndex] = { ...row }
      }
      
      // 保存新行到数据库
      if (currentProjectId.value && currentTableId.value) {
        const newItemData = {
          ...row.data,
          id: undefined // 不传递临时ID
        };
        
        const response = await fetch('http://localhost:8001/api/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({
            projectId: currentProjectId.value,
            tableId: currentTableId.value,
            data: newItemData
          })
        })
        
        if (!response.ok) {
          throw new Error(`创建失败: ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log('[TablePage] 新行创建成功:', result)
        
        // 更新行ID为数据库中的真实ID
        if (itemIndex !== -1) {
          projectItems.value[itemIndex].id = result.id
        }
        
        // 如果当前选中的是这一行，也更新 selectedRow
        if (selectedRow.value && selectedRow.value.id === row.id) {
          selectedRow.value = JSON.parse(JSON.stringify(projectItems.value[itemIndex]))
        }
      }
      
      return
    }
    
    // 已存在的行：立即更新到数据库
    console.log('[TablePage] 更新已有行')
    
    // 更新行数据 - 使用完整的 row.data
    const updatedData = { ...row.data }
    
    const response = await fetch(`http://localhost:8001/api/item/${row.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(updatedData)
    })
    
    if (!response.ok) {
      throw new Error(`更新失败: ${response.statusText}`)
    }
    
    console.log('[TablePage] 数据更新成功')
    
    // 更新本地数据
    const itemIndex = projectItems.value.findIndex(item => item.id === row.id)
    if (itemIndex !== -1) {
      projectItems.value[itemIndex] = { ...row }
    }
    
    // 如果当前选中的是这一行，也更新 selectedRow
    if (selectedRow.value && selectedRow.value.id === row.id) {
      selectedRow.value = JSON.parse(JSON.stringify(projectItems.value[itemIndex]))
    }
  } catch (error) {
    console.error('[TablePage] 保存失败:', error)
    alert('保存失败，请重试')
  }
}

// 添加保存所有新行的函数
const saveNewRows = async () => {
  try {
    // 找出所有新行
    const newRows = projectItems.value.filter(item => item.id.startsWith('new_'))
    
    if (newRows.length === 0) {
      console.log('[TablePage] 没有新行需要保存')
      return
    }
    
    console.log('[TablePage] 保存新行:', newRows.length)
    
    // 获取当前项目 ID
    const projectId = route.query.projectId
    if (!projectId) {
      console.error('[TablePage] 缺少项目 ID')
      alert('缺少项目 ID，无法保存')
      return
    }
    
    // 准备数据
    const itemsData = newRows.map(row => row.data)
    
    // 调用后端 API 创建新 items
    const response = await fetch('http://localhost:8001/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        projectId: parseInt(projectId as string),
        projectName: '',
        items: itemsData,
        table_schema: currentProjectSchema.value
      })
    })
    
    if (!response.ok) {
      throw new Error(`创建失败: ${response.statusText}`)
    }
    
    console.log('[TablePage] 新行批量创建成功')
    
    // 重新加载项目数据以获取新的 ID
    await loadProjectData(parseInt(projectId as string))
    
    alert('新行保存成功')
  } catch (error) {
    console.error('[TablePage] 保存新行失败:', error)
    alert('保存新行失败，请重试')
  }
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

// 处理新增行
const handleAddRow = (newRow: any) => {
  projectItems.value.push(newRow)
  // 不再需要在这里调用API保存新行，而是在编辑关闭时保存
}

// 处理新增列
const handleAddColumn = (columnName: string) => {
  // 检查列名是否已存在
  if (dynamicColumns.value.some(col => col.field === `data.${columnName}` || col.field === columnName)) {
    alert('列名已存在')
    return
  }
  
  dynamicColumns.value.push({
    field: `data.${columnName}`,
    title: columnName,
    width: 150,
    editRender: { name: 'input' }
  })
  
  // TODO: 更新Schema并保存
}

// 生成动态列
const generateColumns = (schema: ProjectSchema | null, items: any[]) => {
  if (schema && schema.fields) {
    return schema.fields.map(field => ({
      field: field.key,
      title: field.label,
      width: 150,
      editRender: { name: 'input' },
      slots: { default: 'default' } // Use generic default slot if needed, or specific ones
    }));
  }
  
  // Fallback: Infer from first item if no schema
  if (items.length > 0) {
    const firstItem = items[0];
    // Exclude internal fields
    const keys = Object.keys(firstItem).filter(k => !['id', 'created_at', 'updated_at', 'project_id', 'data'].includes(k));
    
    // If items have 'data' property (BaseItem structure), use keys from 'data'
    if (firstItem.data) {
        return Object.keys(firstItem.data).map(key => ({
            field: `data.${key}`, // vxe-table supports nested paths? or we flatten it
            title: key,
            width: 150,
            editRender: { name: 'input' }
        }));
    }

    return keys.map(key => ({
      field: key,
      title: key,
      width: 150,
      editRender: { name: 'input' }
    }));
  }
  
  return [];
};



// 根据数据源加载数据
const loadDataBySource = async (source: string, projectId?: string) => {
  sourceType.value = source as 'upload' | 'eagle' | 'manual'
  
  if (projectId) {
      currentProjectId.value = parseInt(projectId);
  }

  switch (source) {
    case 'upload':
    case 'manual':
      if (currentProjectId.value) {
          await loadProjectData(currentProjectId.value);
      }
      break
    case 'eagle':
      // 从Eagle插件获取数据
      await refreshEagleData()
      dynamicColumns.value = [] // Use default columns for Eagle
      break
    default:
      break
  }
}

// 组件挂载时根据路由参数加载数据
onMounted(async () => {
  console.log('[TablePage] onMounted 触发', route.fullPath)
  setCommunication()
  
  const source = route.query.source as string
  const projectId = route.query.projectId as string
  
  if (source) {
    await loadDataBySource(source, projectId)
  }
})

// 路由更新时重新加载数据
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

.toolbar {
  padding: 10px 20px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-tools {
  display: flex;
  gap: 10px;
}

.btn-primary, .btn-secondary {
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid transparent;
}

.btn-primary {
  background-color: #1890ff;
  color: #fff;
}

.btn-primary:hover {
  background-color: #40a9ff;
}

.btn-secondary {
  background-color: #fff;
  border-color: #d9d9d9;
  color: #333;
}

.btn-secondary:hover {
  color: #40a9ff;
  border-color: #40a9ff;
}

.table-tabs {
  display: flex;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 10px;
  height: 40px;
  align-items: flex-end;
}

.tab-item {
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 4px 4px 0 0;
  margin-right: 4px;
  background-color: #e6e6e6;
  color: #666;
  font-size: 14px;
  border: 1px solid transparent;
  border-bottom: none;
  transition: all 0.3s;
}

.tab-item:hover {
  color: #40a9ff;
  background-color: #f0f0f0;
}

.tab-item.active {
  background-color: #fff;
  color: #1890ff;
  border-color: #e8e8e8;
  border-bottom: 1px solid #fff;
  margin-bottom: -1px;
  font-weight: 500;
}

.tab-add {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  color: #666;
  margin-bottom: 4px;
  border-radius: 4px;
}

.tab-add:hover {
  background-color: #e6e6e6;
  color: #1890ff;
}
</style>