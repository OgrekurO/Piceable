import { ref, type Ref } from 'vue'
import type { ProjectSchema } from '@/types/schema'

/**
 * 表格行编辑 Composable
 * 负责行的编辑、新增、保存逻辑
 */
export function useTableRowEdit(
    projectId: Ref<number | null>,
    tableId: Ref<number | null>,
    tableData?: Ref<any[]>
) {
    const selectedRow = ref<any | null>(null)

    /**
     * 处理单元格点击
     */
    const handleCellClick = (row: any) => {
        console.log('[useTableRowEdit] 单元格点击，选中行:', row)
        // 深拷贝行数据以避免直接修改原始数据
        selectedRow.value = JSON.parse(JSON.stringify(row))
    }

    /**
     * 更新选中行的字段
     */
    const updateSelectedRowField = (field: string, event: Event) => {
        if (!selectedRow.value) return

        const target = event.target as HTMLInputElement | HTMLTextAreaElement
        const value = target.value

        // 创建新的对象以触发响应式更新
        selectedRow.value = {
            ...selectedRow.value,
            [field]: value
        }
    }

    /**
     * 保存单个行的编辑
     */
    const saveRowEdit = async (row: any) => {
        try {
            const isNewRow = row.id.startsWith('new_')

            if (isNewRow) {
                // 新行：保存到数据库
                console.log('[useTableRowEdit] 新行编辑，保存到数据库')

                if (!projectId.value || !tableId.value) {
                    throw new Error('缺少项目ID或表格ID')
                }

                const newItemData = {
                    ...row.data,
                    id: undefined // 不传递临时ID
                }

                const response = await fetch('http://localhost:8001/api/items', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    },
                    body: JSON.stringify({
                        projectId: projectId.value,
                        tableId: tableId.value,
                        data: newItemData
                    })
                })

                if (!response.ok) {
                    throw new Error(`创建失败: ${response.statusText}`)
                }

                const result = await response.json()
                console.log('[useTableRowEdit] 新行创建成功:', result)

                return { isNew: true, id: result.id }
            } else {
                // 已存在的行：更新到数据库
                console.log('[useTableRowEdit] 更新已有行')

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

                console.log('[useTableRowEdit] 数据更新成功')

                return { isNew: false, id: row.id }
            }
        } catch (error) {
            console.error('[useTableRowEdit] 保存失败:', error)
            throw error
        }
    }

    /**
     * 更新本地数据(在保存成功后调用)
     * 这个方法封装了数据同步逻辑,View 层不需要关心细节
     */
    const updateLocalData = (row: any, result: { isNew: boolean; id: string | number }) => {
        if (!tableData) return

        const itemIndex = tableData.value.findIndex((item: any) => item.id === row.id)
        if (itemIndex === -1) return

        if (result.isNew) {
            // 更新新行的ID
            tableData.value[itemIndex].id = result.id
        } else {
            // 更新已有行
            tableData.value[itemIndex] = { ...row }
        }

        // 如果当前选中的是这一行，也更新 selectedRow
        if (selectedRow.value?.id === row.id) {
            selectedRow.value = JSON.parse(JSON.stringify(tableData.value[itemIndex]))
        }

        console.log('[useTableRowEdit] 本地数据已同步')
    }

    /**
     * 完整的编辑保存流程(保存 + 同步本地数据)
     */
    const saveAndSync = async (row: any) => {
        const result = await saveRowEdit(row)
        updateLocalData(row, result)
        return result
    }

    /**
     * 批量保存新行
     */
    const saveNewRows = async (
        newRows: any[],
        projectIdValue: number,
        schema: ProjectSchema | null
    ) => {
        try {
            if (newRows.length === 0) {
                console.log('[useTableRowEdit] 没有新行需要保存')
                return
            }

            console.log('[useTableRowEdit] 保存新行:', newRows.length)

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
                    projectId: projectIdValue,
                    projectName: '',
                    items: itemsData,
                    table_schema: schema
                })
            })

            if (!response.ok) {
                throw new Error(`创建失败: ${response.statusText}`)
            }

            console.log('[useTableRowEdit] 新行批量创建成功')

            return true
        } catch (error) {
            console.error('[useTableRowEdit] 保存新行失败:', error)
            throw error
        }
    }

    return {
        selectedRow,
        handleCellClick,
        updateSelectedRowField,
        saveRowEdit,
        updateLocalData,
        saveAndSync,
        saveNewRows
    }
}
