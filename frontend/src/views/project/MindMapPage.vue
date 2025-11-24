<!--
  MindMapPage.vue - 思维导图页面 (重构版)
  
  功能：
  1. 图谱可视化展示
  2. 节点和关系的交互操作
  3. 图谱数据管理（导入/导出）
  4. 图谱配置和设置
  
  架构：
  - 使用 7 个专门的 composables 管理不同职责
  - View 层只负责协调和渲染
  - 所有业务逻辑都在 composables 中
-->
<template>
  <div class="mindmap-page">
    <div class="content-container">
      <!-- Main Graph Canvas -->
      <div class="canvas-wrapper" ref="canvasWrapper">
        <!-- 图谱画布组件 -->
        <GraphCanvas 
          v-if="hasGraphData"
          :data="graphData"
          :config="graphConfig"
          :selected-link="selectedLink"
          :is-placing-node="placingNode"
          @node-click="handleNodeClickWrapper"
          @link-click="handleLinkClick"
          @background-click="handleBackgroundClick"
          @link-change="handleLinkChange"
        />
        
        <!-- 加载状态 -->
        <div v-else-if="loading" class="loading-state">
          <Loader2 class="animate-spin" :size="32" />
          <span>加载中...</span>
        </div>
        
        <!-- 空状态 -->
        <div v-else class="empty-state">
          <div class="empty-icon">
            <Share2 :size="48" />
          </div>
          <p>暂无数据，请导入节点和关系数据</p>
          <div class="empty-actions">
            <button @click="loadDefaultTestData" class="import-btn primary">
              <Upload :size="16" />
              加载测试数据
            </button>
            <button @click="showImportTip" class="import-btn secondary">
              <Upload :size="16" />
              导入自定义数据
            </button>
          </div>
        </div>
        
        <!-- 连线模式提示 -->
        <div v-if="linkingMode" class="linking-mode-hint">
          <div class="hint-content">
            <span v-if="!linkingSourceNode">📍 请点击源节点</span>
            <span v-else>🎯 已选择: {{ linkingSourceNode.label }},请点击目标节点</span>
            <button @click="cancelLinkingMode" class="cancel-btn">
              <X :size="16" />
              取消
            </button>
          </div>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="sidebar-wrapper">
        <GraphSidebar 
          :selected-node="selectedNode"
          :nodes="graphData.nodes"
          :graph-stats="{ nodes: graphData.nodes.length, links: graphData.links.length }"
          :available-tables="availableTables"
          :relationship-fields="relationshipFields"
          @update-config="updateConfig"
          @import-data="handleImportData"
          @export-data="handleExportData"
          @update-table-mapping="updateTableMappingWithCallback"
        />
      </div>

      <!-- Floating Action Button -->
      <div class="fab-container">
        <div v-if="showFabMenu" class="fab-menu">
          <button @click="handleOpenAddNode" class="fab-menu-item">
            <PlusCircle :size="18" /> 添加实体
          </button>
          <button @click="openAddLinkModal" class="fab-menu-item">
            <Share2 :size="18" /> 添加关系
          </button>
          <button @click="triggerImport" class="fab-menu-item">
            <Upload :size="18" /> 导入数据
          </button>
        </div>
        <button class="fab-btn" @click="toggleFabMenu">
          <Plus :size="24" v-if="!showFabMenu" />
          <X :size="24" v-else />
        </button>
      </div>
      
      <!-- Add Node Modal -->
      <el-dialog v-model="showAddNodeModal" title="添加实体" width="400px">
        <el-form :model="newNodeForm" label-width="80px">
          <el-form-item label="名称">
            <el-input v-model="newNodeForm.label" placeholder="实体名称" />
          </el-form-item>
          <el-form-item label="类型">
            <el-input v-model="newNodeForm.type" placeholder="例如: 人, 机构" />
          </el-form-item>
          <el-form-item label="图片URL">
            <el-input v-model="newNodeForm.image" placeholder="http://..." />
          </el-form-item>
          <el-form-item label="描述">
            <el-input type="textarea" v-model="newNodeForm.description" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showAddNodeModal = false">取消</el-button>
          <el-button type="primary" @click="confirmAddNode">确定</el-button>
        </template>
      </el-dialog>

      <!-- Add Link Modal -->
      <el-dialog v-model="showAddLinkModal" title="添加关系" width="400px">
        <el-form :model="newLinkForm" label-width="80px">
          <el-form-item label="源节点">
            <el-select v-model="newLinkForm.source" filterable placeholder="选择源节点">
              <el-option v-for="node in graphData.nodes" :key="node.id" :label="node.label" :value="node.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="目标节点">
            <el-select v-model="newLinkForm.target" filterable placeholder="选择目标节点">
              <el-option v-for="node in graphData.nodes" :key="node.id" :label="node.label" :value="node.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="类型">
            <el-input v-model="newLinkForm.type" placeholder="关系类型" />
          </el-form-item>
          <el-form-item label="方向">
            <el-select v-model="newLinkForm.direction">
              <el-option label="有向 (Directed)" value="directed" />
              <el-option label="无向 (Undirected)" value="undirected" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showAddLinkModal = false">取消</el-button>
          <el-button type="primary" @click="addLink">确定</el-button>
        </template>
      </el-dialog>

      <!-- Legend -->
      <GraphLegend :types="uniqueTypes" />
      
      <!-- Placing Node Hint -->
      <div v-if="placingNode" class="placing-hint">
        <p>点击画布以放置实体: <strong>{{ newNodeForm.label }}</strong></p>
        <button @click="cancelPlaceNode">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Loader2, Plus, X, PlusCircle, Share2, Upload } from 'lucide-vue-next'
import GraphCanvas from '@/components/visualizers/Graph/GraphCanvas.vue'
import GraphSidebar from '@/components/visualizers/Graph/GraphSidebar.vue'
import GraphLegend from '@/components/visualizers/Graph/GraphLegend.vue'
import { useMapStore } from '@/stores/mapStore'
import { storeToRefs } from 'pinia'

// Composables - 数据层
import { useGraphData } from '@/composables/mindMap/useGraphData'
import { useTableMapping } from '@/composables/mindMap/useTableMapping'
import { useProjectData } from '@/composables/mindMap/useProjectData'

// Composables - 交互层
import { useGraphNodes } from '@/composables/mindMap/useGraphNodes'
import { useGraphLinks } from '@/composables/mindMap/useGraphLinks'

// Composables - 工具层
import { useDataImportExport } from '@/composables/mindMap/useDataImportExport'
import { useGraphUI } from '@/composables/mindMap/useGraphUI'

const route = useRoute()
const mapStore = useMapStore()
const { entities } = storeToRefs(mapStore)

// 临时数据存储
const tempNodes = ref<any[]>([])
const tempLinks = ref<any[]>([])

// ========== 先创建基础的 ref,供 composables 使用 ==========
const currentProjectId = ref<number | null>(null)
const availableTables = ref<any[]>([])

// ========== 1. 表格映射 ==========
const {
  tableMapping,
  relationshipFields,
  updateTableMapping
} = useTableMapping(
  currentProjectId,
  availableTables,
  undefined // updateGraphData 将在后面设置
)

// ========== 2. 图谱数据 ==========
const {
  graphData,
  loading,
  hasData,
  hasGraphData,
  updateGraphData
} = useGraphData(entities, tableMapping, tempLinks)

// 现在设置 tableMapping 的回调
// 注意:这里我们需要手动设置,因为 useTableMapping 已经创建了
const originalUpdateTableMapping = updateTableMapping
const updateTableMappingWithCallback = async (mapping: any) => {
  await originalUpdateTableMapping(mapping)
  updateGraphData()
}

// ========== 3. 数据导入导出 ==========
const {
  handleImportData,
  handleUploadNodes,
  handleUploadLinks,
  handleExportData,
  loadDefaultTestData,
  triggerImport,
  showImportTip
} = useDataImportExport(mapStore, graphData, tempNodes, tempLinks)

// ========== 4. 项目数据 ==========
const projectDataComposable = useProjectData(tableMapping, handleImportData)
// 使用项目数据 composable 返回的值来更新我们的 ref
const {
  currentProjectId: projectId,
  availableTables: projectTables,
  loading: projectLoading,
  loadProjectTables,
  loadProjectData
} = projectDataComposable

// 同步 projectId 和 availableTables 到我们的 ref
// 这样 useTableMapping 和 useGraphLinks 就能使用它们了
const syncProjectData = () => {
  currentProjectId.value = projectId.value
  availableTables.value = projectTables.value
}

// 监听变化并同步
watch([projectId, projectTables], syncProjectData, { deep: true })

// ========== 5. 节点管理 ==========
const {
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
} = useGraphNodes(mapStore, updateGraphData)

// ========== 6. 关系管理 ==========
const {
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
  addLink
} = useGraphLinks(
  currentProjectId,
  availableTables,
  tableMapping,
  tempLinks,
  updateGraphData
)

// ========== 7. UI 状态 ==========
const {
  showFabMenu,
  graphConfig,
  uniqueTypes,
  updateConfig,
  toggleFabMenu,
  closeFabMenu
} = useGraphUI(graphData)

// ========== 协调逻辑 ==========

/**
 * 处理节点点击 - 协调连线模式和普通模式
 */
const handleNodeClickWrapper = (node: any) => {
  // 先检查是否在连线模式
  const handled = handleNodeClickInLinkingMode(node)
  if (!handled) {
    // 如果不在连线模式,执行普通点击
    handleNodeClick(node, linkingMode)
  }
}

/**
 * 打开添加节点模态框 - 关闭浮动菜单
 */
const handleOpenAddNode = () => {
  openAddNodeModal()
  closeFabMenu()
}

// ========== 生命周期 ==========

// 监听路由变化，以便在项目切换时重新加载数据
watch(() => route.query.projectId, async (newProjectId, oldProjectId) => {
  console.log('[MindMapPage] 项目ID变更:', oldProjectId, '->', newProjectId)
  if (newProjectId && newProjectId !== oldProjectId) {
    const projectId = parseInt(newProjectId as string)
    currentProjectId.value = projectId
    
    // 重新加载项目表格和数据
    await loadProjectTables(projectId)
  }
})

onMounted(async () => {
  console.log('[MindMapPage] 组件挂载', route.fullPath)
  
  const projectId = route.query.projectId as string
  
  if (projectId) {
    // 设置当前项目ID
    currentProjectId.value = parseInt(projectId)
    
    // 加载项目数据
    await loadProjectTables(parseInt(projectId))
  } else {
    // 检查URL参数,如果有测试参数则加载测试数据
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('test') === 'kumu') {
      await loadDefaultTestData()
    }
  }
})
</script>

<style scoped>
.mindmap-page {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #f8f9fa;
}

.content-container {
  display: flex;
  height: 100%;
  position: relative;
}

.canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: #ffffff;
}

.sidebar-wrapper {
  width: 320px;
  height: 100%;
  background-color: #fff;
  border-left: 1px solid #e8e8e8;
  overflow-y: auto;
}

/* 加载和空状态 */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.loading-state span {
  margin-top: 16px;
  font-size: 14px;
}

.empty-icon {
  color: #ccc;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 24px;
}

.empty-actions {
  display: flex;
  gap: 12px;
}

.import-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.import-btn.primary {
  background-color: #1890ff;
  color: white;
}

.import-btn.primary:hover {
  background-color: #40a9ff;
}

.import-btn.secondary {
  background-color: #fff;
  border: 1px solid #d9d9d9;
  color: #333;
}

.import-btn.secondary:hover {
  color: #40a9ff;
  border-color: #40a9ff;
}

/* 连线模式提示 */
.linking-mode-hint {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.hint-content {
  background-color: #1890ff;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
}

.cancel-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

.cancel-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

/* 浮动按钮 */
.fab-container {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 1000;
}

.fab-menu {
  position: absolute;
  bottom: 70px;
  right: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  min-width: 160px;
}

.fab-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background-color: white;
  color: #333;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
  text-align: left;
}

.fab-menu-item:hover {
  background-color: #f5f5f5;
}

.fab-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #1890ff;
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.fab-btn:hover {
  background-color: #40a9ff;
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.5);
}

/* 节点放置提示 */
.placing-hint {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #52c41a;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 12px;
}

.placing-hint button {
  padding: 4px 12px;
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

.placing-hint button:hover {
  background-color: rgba(255, 255, 255, 0.3);
}
</style>
