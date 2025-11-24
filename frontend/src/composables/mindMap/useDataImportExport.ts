import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as d3 from 'd3'
import { toPng } from 'html-to-image'
import * as XLSX from 'xlsx'
import type { BaseItem } from '@/types/entity'
import type { ProjectSchema } from '@/types/schema'
import { FieldType } from '@/types/schema'
import type { GraphData } from '@/types/graph'

/**
 * 数据导入导出 Composable
 * 负责CSV文件的导入解析、数据导出(PNG/Excel/JSON)和测试数据加载
 */
export function useDataImportExport(
    mapStore: any,
    graphData: any,
    tempNodes: any,
    tempLinks: any
) {
    const loading = ref(false)

    /**
     * 处理数据导入
     */
    const handleImportData = (data: { nodes: any[]; links: any[] }) => {
        // 转换图谱数据为 BaseItem[] 格式
        const items: BaseItem[] = data.nodes.map(node => ({
            id: node.id,
            data: { ...node }
        }))

        // 创建基础 schema
        const schema: ProjectSchema = {
            fields: [
                { key: 'label', label: '标签', type: FieldType.TEXT },
                { key: 'type', label: '类型', type: FieldType.TEXT },
                { key: 'description', label: '描述', type: FieldType.TEXT },
                { key: 'image', label: '图片', type: FieldType.TEXT }
            ]
        }

        // 加载到 store
        mapStore.loadItems(items, schema)
        console.log('[useDataImportExport] 已加载items到store')

        // 处理关系数据
        tempLinks.value = data.links
        console.log('[useDataImportExport] 已设置tempLinks:', tempLinks.value.length)

        ElMessage.success('数据导入成功')
    }

    /**
     * 处理数据导出
     */
    const handleExportData = async (format: string) => {
        if (format === 'png') {
            const el = document.querySelector('.canvas-wrapper') as HTMLElement
            if (el) {
                try {
                    const dataUrl = await toPng(el, { backgroundColor: '#f8f9fa' })
                    const link = document.createElement('a')
                    link.download = `knowledge-graph-${Date.now()}.png`
                    link.href = dataUrl
                    link.click()
                } catch (err) {
                    console.error('[useDataImportExport] 导出PNG失败:', err)
                }
            }
        } else if (format === 'excel') {
            const wb = XLSX.utils.book_new()

            // 节点表
            const nodesWs = XLSX.utils.json_to_sheet(graphData.value.nodes.map((n: any) => {
                const { x, y, vx, vy, index, ...rest } = n // 排除模拟属性
                return rest
            }))
            XLSX.utils.book_append_sheet(wb, nodesWs, 'Elements')

            // 关系表
            const linksWs = XLSX.utils.json_to_sheet(graphData.value.links.map((l: any) => {
                return {
                    From: typeof l.source === 'object' ? (l.source as any).id : l.source,
                    To: typeof l.target === 'object' ? (l.target as any).id : l.target,
                    Type: l.type,
                    Direction: l.Direction,
                    ...l
                }
            }))
            XLSX.utils.book_append_sheet(wb, linksWs, 'Connections')

            XLSX.writeFile(wb, `knowledge-graph-${Date.now()}.xlsx`)
        } else if (format === 'json') {
            const dataStr = JSON.stringify(graphData.value, null, 2)
            const blob = new Blob([dataStr], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.download = `knowledge-graph-${Date.now()}.json`
            link.href = url
            link.click()
            URL.revokeObjectURL(url)
        }
    }

    /**
     * 加载默认测试数据
     */
    const loadDefaultTestData = async () => {
        try {
            loading.value = true

            // 加载实体数据
            const elementsResponse = await fetch('/kumu-ungg-test/Elements-表格 1.csv')
            const elementsText = await elementsResponse.text()
            const elementsData = d3.csvParse(elementsText)

            const nodes = elementsData.map((d: any, index: number) => ({
                id: d.Label || d['﻿Label'] || d.id || `node-${Date.now()}-${index}`,
                label: d.Label || d['﻿Label'] || d.label || d.名称 || 'Unknown',
                type: d.Type || d.type || d.行业 || 'Unknown',
                image: d.Image || d.image,
                description: d.Description || d.description,
                ...d
            })).filter((n: any) => n.id && n.id !== 'Unknown')

            // 加载关系数据
            const connectionsResponse = await fetch('/kumu-ungg-test/Connections-表格 1.csv')
            const connectionsText = await connectionsResponse.text()
            const connectionsData = d3.csvParse(connectionsText)

            const links = connectionsData.map((d: any) => ({
                source: d.From || d.from,
                target: d.To || d.to,
                type: d.Type || d.type || 'Unknown',
                Direction: d.Direction || d.direction || 'directed',
                direction: d.Direction || d.direction || 'directed',
                ...d
            })).filter((l: any) => l.source && l.target)

            console.log('[useDataImportExport] 测试数据加载完成:', nodes.length, '个节点,', links.length, '个关系')

            // 导入数据
            handleImportData({ nodes, links })

            loading.value = false
            ElMessage.success(`成功加载测试数据: ${nodes.length} 个节点, ${links.length} 个关系`)
        } catch (error) {
            console.error('[useDataImportExport] 加载测试数据失败:', error)
            ElMessage.error('加载测试数据失败')
            loading.value = false
        }
    }

    /**
     * 处理文件上传 - 节点
     */
    const handleUploadNodes = async (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return

        const text = await file.text()
        const data = d3.csvParse(text)

        const nodes = data.map((d: any) => ({
            id: d.Label || d['﻿Label'] || d.id || 'Unknown',
            label: d.Label || d['﻿Label'] || d.label || 'Unknown',
            type: d.Type || d.type,
            image: d.Image || d.image,
            description: d.Description || d.description,
            ...d
        })).filter((n: any) => n.id)

        tempNodes.value = nodes
        checkAndEmitImport()
    }

    /**
     * 处理文件上传 - 关系
     */
    const handleUploadLinks = async (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return

        const text = await file.text()
        const data = d3.csvParse(text)

        const links = data.map((d: any) => ({
            source: d.From || d.source,
            target: d.To || d.target,
            type: d.Type || d.type,
            Direction: d.Direction || d.direction || 'directed',
            direction: d.Direction || d.direction || 'directed',
            ...d
        })).filter((l: any) => l.source && l.target)

        tempLinks.value = links
        checkAndEmitImport()
    }

    /**
     * 检查并触发导入
     */
    const checkAndEmitImport = () => {
        if (tempNodes.value.length > 0) {
            const data = {
                nodes: tempNodes.value,
                links: tempLinks.value
            }

            handleImportData(data)

            // 清空临时数据
            tempNodes.value = []
            tempLinks.value = []
        }
    }

    /**
     * 触发导入(检查URL参数)
     */
    const triggerImport = () => {
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('test') === 'kumu') {
            loadDefaultTestData()
        } else {
            showImportTip()
        }
    }

    /**
     * 显示导入提示
     */
    const showImportTip = () => {
        ElMessage.info({
            message: '请在右侧侧边栏的"数据"标签页中导入CSV文件，或者点击"加载测试数据"按钮查看示例。',
            duration: 5000
        })
    }

    return {
        loading,
        handleImportData,
        handleExportData,
        loadDefaultTestData,
        handleUploadNodes,
        handleUploadLinks,
        triggerImport,
        showImportTip
    }
}
