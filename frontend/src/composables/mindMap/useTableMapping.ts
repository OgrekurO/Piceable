import { ref, type Ref } from 'vue'
import type { TableInfo, RelationshipFields } from '@/types/graph'

/**
 * 表格映射管理 Composable
 * 负责管理实体表和关系表的映射,以及关系字段的自动识别
 */
export function useTableMapping(
    currentProjectId: Ref<number | null>,
    availableTables: Ref<TableInfo[]>,
    updateGraphData?: () => void
) {
    const tableMapping = ref<Record<string, 'entity' | 'relationship'>>({})
    const relationshipFields = ref<RelationshipFields>({
        source: '',
        target: '',
        type: ''
    })

    /**
     * 更新表格映射
     */
    const updateTableMapping = async (mapping: { tableId: string; type: 'entity' | 'relationship' }) => {
        // 重置之前的同类型映射
        Object.keys(tableMapping.value).forEach(key => {
            if (tableMapping.value[key] === mapping.type) {
                delete tableMapping.value[key]
            }
        })

        // 设置新的映射
        tableMapping.value[mapping.tableId] = mapping.type

        // 更新表格信息
        availableTables.value = availableTables.value.map(table => ({
            ...table,
            type: tableMapping.value[table.id]
        }))

        // 如果是关系表格,自动识别关系字段
        if (mapping.type === 'relationship') {
            await detectRelationshipFields(mapping.tableId)
        }

        // 更新图谱数据(如果提供了回调)
        updateGraphData?.()
    }

    /**
     * 自动识别关系字段
     */
    const detectRelationshipFields = async (tableId: string) => {
        try {
            // 从后端获取表格数据的第一行,用于分析字段
            if (!currentProjectId.value) return

            const response = await fetch(
                `http://localhost:8001/api/items?projectId=${currentProjectId.value}&tableId=${tableId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                }
            )

            if (!response.ok) {
                console.error('[useTableMapping] 获取表格数据失败')
                return
            }

            const items = await response.json()
            if (items.length === 0) {
                console.warn('[useTableMapping] 表格数据为空')
                return
            }

            // 获取第一行数据的字段名
            const firstItem = items[0]
            const headers = Object.keys(firstItem.data || firstItem)

            // 自动识别关系字段
            const fields = autoDetectRelationshipFields(headers)
            relationshipFields.value = fields

            console.log('[useTableMapping] 自动识别的关系字段:', fields)
        } catch (error) {
            console.error('[useTableMapping] 识别关系字段失败:', error)
        }
    }

    /**
     * 自动识别关系字段的辅助函数
     */
    const autoDetectRelationshipFields = (headers: string[]): RelationshipFields => {
        const fields: RelationshipFields = {
            source: '',
            target: '',
            type: ''
        }

        // 常见的源节点字段名
        const sourceFieldNames = ['From', 'from', 'source', 'Source', 'Start', 'start', '起点', '源', 'src']
        // 常见的目标节点字段名
        const targetFieldNames = ['To', 'to', 'target', 'Target', 'End', 'end', '终点', '目标', 'dest', 'dst']
        // 常见的关系类型字段名
        const typeFieldNames = ['Type', 'type', 'Relation', 'relation', 'Relationship', 'relationship', '类型', '关系', 'Label', 'label']

        headers.forEach(header => {
            if (sourceFieldNames.includes(header) && !fields.source) {
                fields.source = header
            }
            if (targetFieldNames.includes(header) && !fields.target) {
                fields.target = header
            }
            if (typeFieldNames.includes(header) && !fields.type) {
                fields.type = header
            }
        })

        return fields
    }

    return {
        tableMapping,
        relationshipFields,
        updateTableMapping,
        detectRelationshipFields
    }
}
