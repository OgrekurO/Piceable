import { ref, computed, type Ref } from 'vue'
import * as d3 from 'd3'
import type { GraphData, GraphConfig } from '@/types/graph'

/**
 * 图谱UI状态管理 Composable
 * 负责浮动按钮菜单、图谱配置和UI相关状态
 */
export function useGraphUI(graphData: Ref<GraphData>) {
    const showFabMenu = ref(false)

    const graphConfig = ref<GraphConfig>({
        nodeColorBy: 'type',
        showImages: true,
        forceStrength: -2,
        physicsEnabled: true,
        nodeSizeByLinks: true,
        minNodeRadius: 4,
        maxNodeRadius: 20,
        centerForce: 1,
        collideStrength: 0.1,
        nodeLabelField: '名称'
    })

    /**
     * 计算唯一节点类型(用于图例)
     */
    const uniqueTypes = computed(() => {
        const types = new Set(graphData.value.nodes.map(n => n.type || 'Unknown'))
        return Array.from(types)
    })

    /**
     * 更新图谱配置
     */
    const updateConfig = (newConfig: Partial<GraphConfig>) => {
        graphConfig.value = { ...graphConfig.value, ...newConfig }
    }

    /**
     * 切换浮动菜单
     */
    const toggleFabMenu = () => {
        showFabMenu.value = !showFabMenu.value
    }

    /**
     * 关闭浮动菜单
     */
    const closeFabMenu = () => {
        showFabMenu.value = false
    }

    return {
        showFabMenu,
        graphConfig,
        uniqueTypes,
        updateConfig,
        toggleFabMenu,
        closeFabMenu
    }
}
