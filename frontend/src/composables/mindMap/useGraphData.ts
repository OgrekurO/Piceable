import { ref, computed, watch, type Ref } from 'vue'
import type { GraphData, GraphNode, GraphLink } from '@/types/graph'

/**
 * 图谱数据管理 Composable
 * 负责将 VisualEntity 转换为 GraphNode 和 GraphLink
 */
export function useGraphData(
    entities: Ref<any[]>,
    tableMapping: Ref<Record<string, 'entity' | 'relationship'>>,
    tempLinks: Ref<any[]>
) {

    const graphData = ref<GraphData>({ nodes: [], links: [] })
    const loading = ref(true)

    /**
     * 核心转换逻辑:将 VisualEntity[] 转换为 GraphData
     */
    const updateGraphData = () => {
        // 如果没有实体数据,直接返回空图谱
        if (entities.value.length === 0) {
            graphData.value = { nodes: [], links: [] }
            return
        }

        // 根据表格映射过滤节点数据
        const entityTables = Object.keys(tableMapping.value).filter(
            key => tableMapping.value[key] === 'entity'
        )
        const relationshipTables = Object.keys(tableMapping.value).filter(
            key => tableMapping.value[key] === 'relationship'
        )

        // 转换节点数据
        const nodes: GraphNode[] = entities.value
            .filter(() => {
                // 根据表格映射过滤,如果没有映射则默认包含所有
                if (entityTables.length > 0) {
                    return true // 简化处理
                }
                return true
            })
            .map(e => {
                // 尝试从data中提取label
                let label = '未命名'
                if (e.data.label) {
                    label = e.data.label
                } else if (e.data.Label) {
                    label = e.data.Label
                } else if (e.data.name) {
                    label = e.data.name
                } else if (e.primaryLabel && e.primaryLabel !== '未命名') {
                    label = e.primaryLabel
                } else if (e.data.名称) {
                    label = e.data.名称
                }

                return {
                    id: e.id,
                    label: label,
                    type: (e.data.type || e.data.Type || e.data.category || e.data.行业 || 'Unknown') as string,
                    image: e.data.image as string,
                    description: e.data.description as string,
                    ...e.data,
                    // 保持现有的模拟状态
                    x: graphData.value.nodes.find(n => n.id === e.id)?.x,
                    y: graphData.value.nodes.find(n => n.id === e.id)?.y,
                }
            })

        // 构建关系数据
        const links: GraphLink[] = []

        console.log('[useGraphData] 开始构建关系数据')
        console.log('[useGraphData] tempLinks数量:', tempLinks.value.length)
        console.log('[useGraphData] nodes数量:', nodes.length)

        // 处理存储在tempLinks中的关系数据
        if (tempLinks.value.length > 0) {
            console.log('[useGraphData] 使用tempLinks构建关系')
            tempLinks.value.forEach((linkData: any, index: number) => {
                console.log(`[useGraphData] 处理关系 ${index}:`, linkData)

                // 查找源节点和目标节点 - 改进匹配逻辑
                const sourceNode = nodes.find(node => {
                    const match =
                        node.id === linkData.source ||
                        node.label === linkData.source ||
                        node.Label === linkData.source ||
                        node.名称 === linkData.source ||
                        (node as any)[linkData.source] !== undefined

                    if (match) {
                        console.log(`  找到源节点: ${node.id} (label: ${node.label})`)
                    }
                    return match
                })

                const targetNode = nodes.find(node => {
                    const match =
                        node.id === linkData.target ||
                        node.label === linkData.target ||
                        node.Label === linkData.target ||
                        node.名称 === linkData.target ||
                        (node as any)[linkData.target] !== undefined

                    if (match) {
                        console.log(`  找到目标节点: ${node.id} (label: ${node.label})`)
                    }
                    return match
                })

                if (sourceNode && targetNode) {
                    const link = {
                        source: sourceNode.id,
                        target: targetNode.id,
                        type: linkData.type || linkData.Type || 'Unknown',
                        Direction: linkData.Direction || linkData.direction || 'directed',
                        direction: linkData.Direction || linkData.direction || 'directed',
                        id: `${sourceNode.id}-${targetNode.id}-${linkData.type || linkData.Type || 'Unknown'}`
                    }
                    links.push(link)
                    console.log(`  ✓ 成功创建关系:`, link)
                } else {
                    console.warn(`  ✗ 未找到节点 - source: ${linkData.source} (${sourceNode ? '找到' : '未找到'}), target: ${linkData.target} (${targetNode ? '找到' : '未找到'})`)
                }
            })
        }
        // 如果有明确的关系表映射
        else if (relationshipTables.length > 0) {
            entities.value.forEach(e => {
                if (relationshipTables.includes('connections')) {
                    if (e.links) {
                        e.links.forEach((l: any) => {
                            if (entities.value.some(target => target.id === l.targetId)) {
                                links.push({
                                    source: e.id,
                                    target: l.targetId,
                                    type: l.relationType,
                                    Direction: l.direction || 'directed',
                                    direction: l.direction || 'directed',
                                    id: `${e.id}-${l.targetId}-${l.relationType}`
                                })
                            }
                        })
                    }
                }
            })
        } else {
            // 默认处理关系
            entities.value.forEach((e: any) => {
                // 如果实体有links属性
                if (e.links) {
                    e.links.forEach((l: any) => {
                        if (entities.value.some(target => target.id === l.targetId)) {
                            links.push({
                                source: e.id,
                                target: l.targetId,
                                type: l.relationType,
                                Direction: l.direction || 'directed',
                                direction: l.direction || 'directed',
                                id: `${e.id}-${l.targetId}-${l.relationType}`
                            })
                        }
                    })
                }
                // 如果实体本身看起来像关系数据(有From/To字段)
                else if (e.data.From && e.data.To) {
                    const sourceNode = entities.value.find(node =>
                        node.id === e.data.From ||
                        node.data.label === e.data.From ||
                        node.data.Label === e.data.From
                    )
                    const targetNode = entities.value.find(node =>
                        node.id === e.data.To ||
                        node.data.label === e.data.To ||
                        node.data.Label === e.data.To
                    )

                    if (sourceNode && targetNode) {
                        links.push({
                            source: sourceNode.id,
                            target: targetNode.id,
                            type: e.data.Type || e.data.type || 'Unknown',
                            Direction: e.data.Direction || e.data.direction || 'directed',
                            direction: e.data.Direction || e.data.direction || 'directed',
                            id: `${sourceNode.id}-${targetNode.id}-${e.data.Type || e.data.type || 'Unknown'}`
                        })
                    }
                }
            })
        }

        console.log('[useGraphData] 转换后的节点:', nodes)
        console.log('[useGraphData] 转换后的关系:', links)
        console.log('[useGraphData] 图谱数据更新，节点数:', nodes.length, '关系数:', links.length)

        graphData.value = { nodes, links }
    }

    // 监听实体变化
    watch(entities, () => {
        updateGraphData()
        loading.value = false
    }, { deep: true, immediate: true })

    // 计算属性
    const hasData = computed(() => entities.value.length > 0)
    const hasGraphData = computed(() => graphData.value.nodes.length > 0)

    return {
        graphData,
        loading,
        updateGraphData,
        hasData,
        hasGraphData
    }
}
