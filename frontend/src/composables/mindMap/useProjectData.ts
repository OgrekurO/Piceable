import { ref, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { TableInfo } from '@/types/graph'

/**
 * 项目数据加载 Composable
 * 负责从后端加载项目的表格列表和数据
 */
export function useProjectData(
    tableMapping: Ref<Record<string, 'entity' | 'relationship'>>,
    handleImportData: (data: { nodes: any[]; links: any[] }) => void
) {
    const currentProjectId = ref<number | null>(null)
    const availableTables = ref<TableInfo[]>([])
    const loading = ref(false)

    /**
     * 加载项目的表格列表
     */
    const loadProjectTables = async (projectId: number) => {
        currentProjectId.value = projectId
        try {
            const response = await fetch(`http://localhost:8001/api/projects/${projectId}/tables`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            })

            if (!response.ok) {
                console.error('[useProjectData] 获取表格列表失败')
                return
            }

            const tables = await response.json()
            availableTables.value = tables.map((table: any) => ({
                id: table.id.toString(),
                name: table.name,
                type: tableMapping.value[table.id.toString()]
            }))

            console.log('[useProjectData] 加载的表格列表:', availableTables.value)

            // 加载表格数据
            await loadProjectData(projectId)
        } catch (error) {
            console.error('[useProjectData] 加载表格列表失败:', error)
        }
    }

    /**
     * 从项目的表格中加载数据
     */
    const loadProjectData = async (projectId: number) => {
        try {
            loading.value = true
            console.log('[useProjectData] 开始加载项目数据, projectId:', projectId)

            // 获取项目的所有items
            const response = await fetch(`http://localhost:8001/api/items?projectId=${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            })

            if (!response.ok) {
                console.error('[useProjectData] 获取项目数据失败')
                loading.value = false
                return
            }

            const items = await response.json()

            if (items.length === 0) {
                ElMessage.warning('项目中没有数据')
                loading.value = false
                return
            }

            // 分析数据,区分实体和关系
            const nodes: any[] = []
            const links: any[] = []

            items.forEach((item: any) => {
                const data = item.data || item

                // 检查是否是关系数据(有From/To字段)
                const hasFrom = data.From || data.from || data.source || data.Source
                const hasTo = data.To || data.to || data.target || data.Target

                if (hasFrom && hasTo) {
                    // 这是关系数据
                    links.push({
                        source: data.From || data.from || data.source || data.Source,
                        target: data.To || data.to || data.target || data.Target,
                        type: data.Type || data.type || 'Unknown',
                        Direction: data.Direction || data.direction || 'directed',
                        direction: data.Direction || data.direction || 'directed',
                        ...data
                    })
                } else {
                    // 这是实体数据
                    const nodeId = data.Label || data.label || data.名称 || data.name || data.id || item.id
                    nodes.push({
                        id: nodeId,
                        label: data.Label || data.label || data.名称 || data.name || nodeId,
                        type: data.Type || data.type || data.行业 || data.category || 'Unknown',
                        image: data.Image || data.image,
                        description: data.Description || data.description,
                        ...data
                    })
                }
            })

            console.log('[useProjectData] 解析后的nodes数量:', nodes.length)
            console.log('[useProjectData] 解析后的links数量:', links.length)

            if (nodes.length === 0) {
                ElMessage.warning('项目中没有实体数据')
                loading.value = false
                return
            }

            // 导入数据到图谱
            handleImportData({ nodes, links })

            ElMessage.success(`成功加载 ${nodes.length} 个节点和 ${links.length} 个关系`)
            loading.value = false
        } catch (error) {
            console.error('[useProjectData] 加载项目数据失败:', error)
            ElMessage.error('加载项目数据失败: ' + (error as Error).message)
            loading.value = false
        }
    }

    return {
        currentProjectId,
        availableTables,
        loading,
        loadProjectTables,
        loadProjectData
    }
}
