import { ref, computed } from 'vue'
import type { ProjectSchema } from '@/types/schema'

/**
 * 表格列管理 Composable
 * 负责动态列的生成和管理
 */
export function useTableColumns() {
    const dynamicColumns = ref<any[]>([])

    /**
     * 根据 schema 生成列配置
     */
    const generateColumnsFromSchema = (schema: ProjectSchema | null) => {
        if (!schema || !schema.fields) {
            dynamicColumns.value = []
            return []
        }

        const columns = schema.fields.map(field => ({
            field: `data.${field.key}`,
            title: field.label,
            width: 150,
            editRender: { name: 'input' } // 简单起见，都用 input
        }))

        dynamicColumns.value = columns
        return columns
    }

    /**
     * 从数据推断列配置(当没有 schema 时)
     */
    const generateColumnsFromData = (items: any[]) => {
        if (items.length === 0) {
            dynamicColumns.value = []
            return []
        }

        const firstItem = items[0]

        // 如果 items 有 'data' 属性，使用 data 中的键
        if (firstItem.data) {
            const columns = Object.keys(firstItem.data).map(key => ({
                field: `data.${key}`,
                title: key,
                width: 150,
                editRender: { name: 'input' }
            }))

            dynamicColumns.value = columns
            return columns
        }

        // 否则使用顶层键(排除内部字段)
        const keys = Object.keys(firstItem).filter(k =>
            !['id', 'created_at', 'updated_at', 'project_id', 'data'].includes(k)
        )

        const columns = keys.map(key => ({
            field: key,
            title: key,
            width: 150,
            editRender: { name: 'input' }
        }))

        dynamicColumns.value = columns
        return columns
    }

    /**
     * 添加新列
     */
    const addColumn = (columnName: string) => {
        // 检查列名是否已存在
        if (dynamicColumns.value.some(col =>
            col.field === `data.${columnName}` || col.field === columnName
        )) {
            throw new Error('列名已存在')
        }

        const newColumn = {
            field: `data.${columnName}`,
            title: columnName,
            width: 150,
            editRender: { name: 'input' }
        }

        dynamicColumns.value.push(newColumn)

        return newColumn
    }

    /**
     * 移除列
     */
    const removeColumn = (columnField: string) => {
        const index = dynamicColumns.value.findIndex(col => col.field === columnField)
        if (index !== -1) {
            dynamicColumns.value.splice(index, 1)
        }
    }

    /**
     * 更新列配置
     */
    const updateColumn = (columnField: string, updates: Partial<any>) => {
        const column = dynamicColumns.value.find(col => col.field === columnField)
        if (column) {
            Object.assign(column, updates)
        }
    }

    return {
        dynamicColumns,
        generateColumnsFromSchema,
        generateColumnsFromData,
        addColumn,
        removeColumn,
        updateColumn
    }
}
