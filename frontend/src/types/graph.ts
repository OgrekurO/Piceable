import type * as d3 from 'd3'

/**
 * 图谱节点类型
 */
export interface GraphNode extends d3.SimulationNodeDatum {
    id: string
    label: string
    type?: string
    image?: string
    description?: string
    x?: number
    y?: number
    [key: string]: any
}

/**
 * 图谱关系类型
 */
export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
    source: string | GraphNode
    target: string | GraphNode
    type?: string
    Direction?: string
    curvature?: number
    direction?: string
    [key: string]: any
}

/**
 * 图谱数据
 */
export interface GraphData {
    nodes: GraphNode[]
    links: GraphLink[]
}

/**
 * 表格信息
 */
export interface TableInfo {
    id: string
    name: string
    type?: 'entity' | 'relationship'
}

/**
 * 关系字段映射
 */
export interface RelationshipFields {
    source: string
    target: string
    type: string
}

/**
 * 图谱配置
 */
export interface GraphConfig {
    nodeColorBy: string
    showImages: boolean
    forceStrength: number
    physicsEnabled: boolean
    nodeSizeByLinks: boolean
    minNodeRadius: number
    maxNodeRadius: number
    centerForce: number
    collideStrength: number
    nodeLabelField: string
}
