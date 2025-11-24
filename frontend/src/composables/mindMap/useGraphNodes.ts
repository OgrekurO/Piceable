import { ref, reactive } from 'vue'
import type { GraphNode } from '@/types/graph'

/**
 * 图谱节点管理 Composable
 * 负责节点的添加、删除、更新和选中状态管理
 */
export function useGraphNodes(
    mapStore: any,
    updateGraphData: () => void
) {
    const selectedNode = ref<GraphNode | null>(null)
    const showAddNodeModal = ref(false)
    const placingNode = ref(false)
    const tempCoords = ref<{ x: number; y: number } | null>(null)

    const newNodeForm = reactive({
        label: '',
        type: '',
        image: '',
        description: ''
    })

    /**
     * 打开添加节点模态框
     */
    const openAddNodeModal = () => {
        // 重置表单
        newNodeForm.label = ''
        newNodeForm.type = ''
        newNodeForm.image = ''
        newNodeForm.description = ''

        // 启动放置模式
        placingNode.value = true
    }

    /**
     * 取消放置节点
     */
    const cancelPlaceNode = () => {
        placingNode.value = false
        tempCoords.value = null
    }

    /**
     * 确认添加节点
     */
    const confirmAddNode = () => {
        if (!newNodeForm.label) return

        // 使用 mapStore 添加项目
        const newItem = {
            id: newNodeForm.label, // 或生成 UUID
            data: {
                label: newNodeForm.label,
                type: newNodeForm.type,
                image: newNodeForm.image,
                description: newNodeForm.description
            }
        }

        mapStore.addItem(newItem)

        showAddNodeModal.value = false
        tempCoords.value = null
    }

    /**
     * 处理节点点击
     */
    const handleNodeClick = (node: GraphNode, linkingMode?: any) => {
        // 如果在连线模式,不处理节点选中
        if (linkingMode && linkingMode.value) {
            return
        }

        console.log('[useGraphNodes] 节点点击:', node)
        selectedNode.value = node
    }

    /**
     * 处理背景点击
     */
    const handleBackgroundClick = (coords?: { x: number; y: number }) => {
        if (placingNode.value && coords) {
            // 保存坐标并打开模态框
            tempCoords.value = coords
            placingNode.value = false
            showAddNodeModal.value = true
        } else {
            // 取消选中
            selectedNode.value = null
        }
    }

    return {
        selectedNode,
        showAddNodeModal,
        placingNode,
        tempCoords,
        newNodeForm,
        openAddNodeModal,
        cancelPlaceNode,
        confirmAddNode,
        handleNodeClick,
        handleBackgroundClick
    }
}
