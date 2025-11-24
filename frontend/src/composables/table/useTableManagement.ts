import { ref, computed } from 'vue'
import { getTables, createTable } from '@/core/services/tableService'
import { getUploadedItems } from '@/core/services/uploadedItemsService'
import type { Table, ProjectSchema } from '@/types/schema'

/**
 * 表格管理 Composable
 * 负责表格的切换、加载、数据管理
 */
export function useTableManagement() {
    // 状态
    const tables = ref<Table[]>([])
    const currentTableId = ref<number | null>(null)
    const currentTableData = ref<any[]>([])
    const currentTableSchema = ref<ProjectSchema | null>(null)
    const loading = ref(false)

    // 当前表格
    const currentTable = computed(() =>
        tables.value.find(t => t.id === currentTableId.value)
    )

    /**
     * 加载项目的所有表格
     */
    const loadTables = async (projectId: number) => {
        try {
            tables.value = await getTables(projectId)
            console.log('[useTableManagement] 获取到表格:', tables.value)
            return tables.value
        } catch (error) {
            console.error('[useTableManagement] 加载表格列表失败:', error)
            throw error
        }
    }

    /**
     * 切换到指定表格
     */
    const switchTable = async (tableId: number, projectId: number) => {
        if (currentTableId.value === tableId) return

        currentTableId.value = tableId
        await loadTableData(tableId, projectId)
    }

    /**
     * 加载表格数据
     */
    const loadTableData = async (tableId: number, projectId: number) => {
        loading.value = true
        try {
            // 1. 获取表格详情
            const table = tables.value.find(t => t.id === tableId)

            let schema = table?.schema

            // 如果是关系表且没有schema，使用默认schema
            if (!schema && (table?.name === 'Relationships' || table?.name === '关系')) {
                schema = {
                    fields: [
                        { key: 'From', label: '源节点', type: 'text' as any },
                        { key: 'To', label: '目标节点', type: 'text' as any },
                        { key: 'Direction', label: '方向', type: 'select' as any, options: [{ id: 'directed', label: 'Directed', color: '#000' }, { id: 'undirected', label: 'Undirected', color: '#000' }] },
                        { key: 'Label', label: '标签', type: 'text' as any },
                        { key: 'Type', label: '类型', type: 'text' as any },
                        { key: 'Tags', label: '标签', type: 'multi_select' as any },
                        { key: 'Description', label: '描述', type: 'text' as any },
                        { key: 'Image', label: '图片', type: 'image' as any }
                    ]
                }
            }

            currentTableSchema.value = schema || null

            // 2. 获取表格数据
            const items = await getUploadedItems(projectId, tableId)
            currentTableData.value = items || []

            console.log(`[useTableManagement] 已加载表格 ${table?.name} (ID: ${tableId}) 的数据，共 ${items.length} 项`)

            return { schema, items }
        } catch (error) {
            console.error('[useTableManagement] 加载表格数据失败:', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    /**
     * 创建新表格
     */
    const createNewTable = async (projectId: number, tableName: string, schema?: ProjectSchema) => {
        try {
            const newTable = await createTable(projectId, tableName, schema || null)
            tables.value.push(newTable)
            return newTable
        } catch (error) {
            console.error('[useTableManagement] 创建表格失败:', error)
            throw error
        }
    }

    return {
        // 状态
        tables,
        currentTableId,
        currentTableData,
        currentTableSchema,
        currentTable,
        loading,

        // 方法
        loadTables,
        switchTable,
        loadTableData,
        createNewTable
    }
}
