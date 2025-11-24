import { ref, reactive, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { GraphNode, GraphLink, TableInfo } from '@/types/graph'

/**
 * 图谱关系管理 Composable
 * 负责关系的添加、删除、更新和连线模式管理
 */
export function useGraphLinks(
    currentProjectId: Ref<number | null>,
    availableTables: Ref<TableInfo[]>,
    tableMapping: Ref<Record<string, 'entity' | 'relationship'>>,
    tempLinks: Ref<any[]>,
    updateGraphData: () => void
) {
    const selectedLink = ref<GraphLink | null>(null)
    const showAddLinkModal = ref(false)
    const linkingMode = ref(false)
    const linkingSourceNode = ref<GraphNode | null>(null)

    const newLinkForm = reactive({
        source: '',
        target: '',
        type: '',
        direction: 'directed'
    })

    /**
     * 打开添加关系模态框(启动连线模式)
     */
    const openAddLinkModal = () => {
        linkingMode.value = true
        linkingSourceNode.value = null
        ElMessage.info('连线模式已启动,请点击源节点,然后点击目标节点')
    }

    /**
     * 取消连线模式
     */
    const cancelLinkingMode = () => {
        linkingMode.value = false
        linkingSourceNode.value = null
    }

    /**
     * 处理关系点击
     */
    const handleLinkClick = (link: GraphLink) => {
        selectedLink.value = link
        console.log('[useGraphLinks] 关系点击:', link)
    }

    /**
     * 处理连线模式下的节点点击
     */
    const handleNodeClickInLinkingMode = (node: GraphNode): boolean => {
        if (!linkingMode.value) return false

        if (!linkingSourceNode.value) {
            // 第一次点击,选择源节点
            linkingSourceNode.value = node
            ElMessage.success(`已选择源节点: ${node.label},请点击目标节点`)
        } else {
            // 第二次点击,选择目标节点并创建连线
            if (linkingSourceNode.value.id === node.id) {
                ElMessage.warning('源节点和目标节点不能相同')
                return true
            }

            // 创建新连线
            createNewLink(linkingSourceNode.value, node)

            // 退出连线模式
            linkingMode.value = false
            linkingSourceNode.value = null
        }

        return true // 已处理
    }

    /**
     * 处理关系变化
     */
    const handleLinkChange = (link: GraphLink) => {
        // Link对象被D3/Canvas修改,如果需要可以触发响应式
        console.log('[useGraphLinks] 关系变化:', link)
    }

    /**
     * 确保项目有关系表
     */
    const ensureRelationshipTable = async (projectId: number): Promise<number> => {
        try {
            // 检查是否已有关系表
            const existingTable = availableTables.value.find(t =>
                t.name.toLowerCase() === 'relationships' ||
                t.name.toLowerCase() === '关系' ||
                t.type === 'relationship'
            )

            if (existingTable) {
                console.log('[useGraphLinks] 使用现有关系表:', existingTable.id)
                return parseInt(existingTable.id)
            }

            // 创建新的关系表
            console.log('[useGraphLinks] 创建新的关系表')

            const response = await fetch(`http://localhost:8001/api/projects/${projectId}/tables`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({
                    name: 'Relationships',
                    description: '存储节点间的关系数据'
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.detail || '创建关系表失败')
            }

            const newTable = await response.json()
            console.log('[useGraphLinks] 创建成功:', newTable)

            // 更新表格列表
            availableTables.value.push({
                id: newTable.id.toString(),
                name: newTable.name,
                type: 'relationship'
            })

            // 更新表格映射
            tableMapping.value[newTable.id.toString()] = 'relationship'

            ElMessage.success('已自动创建关系表')
            return newTable.id
        } catch (error) {
            console.error('[useGraphLinks] 创建关系表失败:', error)
            ElMessage.error('创建关系表失败: ' + (error as Error).message)
            throw error
        }
    }

    /**
     * 创建新连线
     */
    const createNewLink = async (sourceNode: GraphNode, targetNode: GraphNode) => {
        try {
            if (!currentProjectId.value) {
                ElMessage.error('未找到项目ID')
                return
            }

            console.log('[useGraphLinks] 创建连线:', sourceNode.label, '->', targetNode.label)

            // 确保有关系表
            const tableId = await ensureRelationshipTable(currentProjectId.value)

            // 创建关系数据
            const relationshipData = {
                From: sourceNode.label,
                To: targetNode.label,
                Type: '关联', // 默认类型
                Direction: 'directed',
                Description: '',
                CreatedAt: new Date().toISOString()
            }

            // 保存到后端
            const response = await fetch(`http://localhost:8001/api/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({
                    projectId: currentProjectId.value,
                    tableId: tableId,
                    data: relationshipData
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.detail || '保存关系失败')
            }

            const savedItem = await response.json()

            // 添加到临时links中
            tempLinks.value.push({
                source: sourceNode.id,
                target: targetNode.id,
                type: relationshipData.Type,
                Direction: relationshipData.Direction,
                direction: relationshipData.Direction,
                ...relationshipData
            })

            // 更新图谱
            updateGraphData()

            ElMessage.success(`已创建连线: ${sourceNode.label} → ${targetNode.label}`)
        } catch (error) {
            console.error('[useGraphLinks] 创建连线失败:', error)
            ElMessage.error('创建连线失败: ' + (error as Error).message)
        }
    }

    /**
     * 添加关系(通过表单)
     */
    const addLink = () => {
        if (!newLinkForm.source || !newLinkForm.target) return

        // 提示用户此功能需要后端支持
        ElMessage.warning('添加关系功能需要后端支持或明确的数据结构定义')

        showAddLinkModal.value = false
    }

    return {
        selectedLink,
        showAddLinkModal,
        linkingMode,
        linkingSourceNode,
        newLinkForm,
        openAddLinkModal,
        cancelLinkingMode,
        handleLinkClick,
        handleNodeClickInLinkingMode,
        handleLinkChange,
        createNewLink,
        addLink
    }
}
