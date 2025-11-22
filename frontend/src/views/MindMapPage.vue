<template>
  <div class="mindmap-page">

    <div class="content-container">
      <!-- Main Graph Canvas -->
      <div class="canvas-wrapper" ref="canvasWrapper">
        <GraphCanvas 
          v-if="graphData.nodes.length > 0"
          :data="graphData"
          :config="graphConfig"
          :selected-link="selectedLink"
          :is-placing-node="placingNode"
          @node-click="handleNodeClick"
          @link-click="handleLinkClick"
          @background-click="handleBackgroundClick"
          @link-change="handleLinkChange"
        />
        <div v-else class="loading-state">
          <Loader2 class="animate-spin" :size="32" />
          <span>正在加载数据...</span>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="sidebar-wrapper">
        <GraphSidebar 
          :selected-node="selectedNode"
          :graph-stats="{ nodes: graphData.nodes.length, links: graphData.links.length }"
          @update-config="updateConfig"
          @import-data="handleImportData"
          @export-data="handleExportData"
        />
      </div>

      <!-- Floating Action Button -->
      <div class="fab-container">
        <div v-if="showFabMenu" class="fab-menu">
          <button @click="openAddNodeModal" class="fab-menu-item">
            <PlusCircle :size="18" /> 添加实体
          </button>
          <button @click="openAddLinkModal" class="fab-menu-item">
            <Share2 :size="18" /> 添加关系
          </button>
          <button @click="triggerImport" class="fab-menu-item">
            <Upload :size="18" /> 导入数据
          </button>
        </div>
        <button class="fab-btn" @click="showFabMenu = !showFabMenu">
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
      <div class="legend-panel">
        <h3>图例</h3>
        <div v-for="type in uniqueTypes" :key="type" class="legend-item">
          <span class="color-box" :style="{ backgroundColor: colorScale(type) }"></span>
          <span>{{ type || 'Unknown' }}</span>
        </div>
      </div>
      
      <!-- Placing Node Hint -->
      <div v-if="placingNode" class="placing-hint">
        <p>点击画布以放置实体: <strong>{{ newNodeForm.label }}</strong></p>
        <button @click="cancelPlaceNode">取消</button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { ArrowLeft, Loader2, Plus, X, PlusCircle, Share2, Upload } from 'lucide-vue-next';
import GraphCanvas from '@/components/graph/GraphCanvas.vue';
import GraphSidebar from '@/components/graph/GraphSidebar.vue';
import * as d3 from 'd3';
import { toPng } from 'html-to-image';
import * as XLSX from 'xlsx';

// Types
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type?: string;
  image?: string;
  description?: string;
  x?: number;
  y?: number;
  [key: string]: any;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type?: string;
  Direction?: string;
  curvature?: number;
  [key: string]: any;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// State
const graphData = ref<GraphData>({ nodes: [], links: [] });
const selectedNode = ref<GraphNode | null>(null);
const selectedLink = ref<GraphLink | null>(null);
const graphConfig = ref({
  nodeColorBy: 'Type',
  showImages: true,
  forceStrength: -2,
  physicsEnabled: true,
  nodeSizeByLinks: true,
  minNodeRadius: 4,
  maxNodeRadius: 20,
  centerForce: 1,
  collideStrength: 0.1
});

// Color Scale
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

const uniqueTypes = computed(() => {
  const types = new Set(graphData.value.nodes.map(n => n.type || 'Unknown'));
  return Array.from(types);
});

// FAB State
const showFabMenu = ref(false);
const showAddNodeModal = ref(false);
const showAddLinkModal = ref(false);
const placingNode = ref(false);

const newNodeForm = reactive({
  label: '',
  type: '',
  image: '',
  description: ''
});

const newLinkForm = reactive({
  source: '',
  target: '',
  type: '',
  direction: 'directed'
});

const tempCoords = ref<{ x: number, y: number } | null>(null);

// Methods
const openAddNodeModal = () => {
  // Start placing mode first
  newNodeForm.label = '';
  newNodeForm.type = '';
  newNodeForm.image = '';
  newNodeForm.description = '';
  
  placingNode.value = true;
  showFabMenu.value = false;
};

const openAddLinkModal = () => {
  newLinkForm.source = '';
  newLinkForm.target = '';
  newLinkForm.type = '';
  newLinkForm.direction = 'directed';
  showAddLinkModal.value = true;
  showFabMenu.value = false;
};

const triggerImport = () => {
  alert('请在右侧侧边栏的“数据”标签页中导入数据。');
  showFabMenu.value = false;
};

const cancelPlaceNode = () => {
  placingNode.value = false;
};

const handleNodeClick = (node: GraphNode) => {
  if (placingNode.value) return;
  selectedNode.value = node;
  selectedLink.value = null;
};

const handleLinkClick = (link: GraphLink) => {
  if (placingNode.value) return;
  selectedLink.value = link;
  selectedNode.value = null;
};

const confirmAddNode = () => {
  if (!newNodeForm.label) return;
  const id = newNodeForm.label;
  if (graphData.value.nodes.find(n => n.id === id)) {
    alert('节点已存在');
    return;
  }
  
  const newNode: GraphNode = {
    id: newNodeForm.label,
    label: newNodeForm.label,
    type: newNodeForm.type,
    image: newNodeForm.image,
    description: newNodeForm.description,
    x: tempCoords.value?.x || 0,
    y: tempCoords.value?.y || 0,
  };
  
  graphData.value.nodes.push(newNode);
  graphData.value = { ...graphData.value };
  
  showAddNodeModal.value = false;
  tempCoords.value = null;
};

const handleBackgroundClick = (coords?: { x: number, y: number }) => {
  if (placingNode.value && coords) {
    // Saved coords and open modal
    tempCoords.value = coords;
    placingNode.value = false;
    showAddNodeModal.value = true;
  } else {
    selectedNode.value = null;
    selectedLink.value = null;
  }
};

const handleLinkChange = (link: GraphLink) => {
  // Link object is mutated by D3/Canvas, just trigger reactivity if needed
  // graphData.value = { ...graphData.value };
};

const addLink = () => {
  if (!newLinkForm.source || !newLinkForm.target) return;
  
  const newLink: GraphLink = {
    source: newLinkForm.source,
    target: newLinkForm.target,
    type: newLinkForm.type,
    Direction: newLinkForm.direction
  };
  
  graphData.value.links.push(newLink);
  graphData.value = { ...graphData.value };
  showAddLinkModal.value = false;
};

const updateConfig = (newConfig: any) => {
  graphConfig.value = newConfig;
};

const handleImportData = (data: { nodes: any[], links: any[] }) => {
  const nodes: GraphNode[] = data.nodes.map(d => ({
    id: d.Label,
    label: d.Label,
    type: d.Type,
    image: d.Image,
    description: d.Description,
    ...d
  })).filter(n => n.id);

  const links: GraphLink[] = data.links.map(d => ({
    source: d.From || '',
    target: d.To || '',
    type: d.Type,
    Direction: d.Direction,
    ...d
  })).filter(l => l.source && l.target) as unknown as GraphLink[];

  const uniqueNodes = Array.from(new Map(nodes.map(n => [n.id, n])).values());
  
  graphData.value = { nodes: uniqueNodes, links };
};

const handleExportData = async (format: string) => {
  if (format === 'png') {
    const el = document.querySelector('.canvas-wrapper') as HTMLElement;
    if (el) {
      try {
        const dataUrl = await toPng(el, { backgroundColor: '#f8f9fa' });
        const link = document.createElement('a');
        link.download = `knowledge-graph-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Export PNG failed:', err);
      }
    }
  } else if (format === 'excel') {
    const wb = XLSX.utils.book_new();
    
    // Nodes Sheet
    const nodesWs = XLSX.utils.json_to_sheet(graphData.value.nodes.map(n => {
      const { x, y, vx, vy, index, ...rest } = n; // Exclude simulation props
      return rest;
    }));
    XLSX.utils.book_append_sheet(wb, nodesWs, "Elements");

    // Links Sheet
    const linksWs = XLSX.utils.json_to_sheet(graphData.value.links.map(l => {
       return {
         From: typeof l.source === 'object' ? (l.source as any).id : l.source,
         To: typeof l.target === 'object' ? (l.target as any).id : l.target,
         Type: l.type,
         Direction: l.Direction,
         ...l
       };
    }));
    XLSX.utils.book_append_sheet(wb, linksWs, "Connections");

    XLSX.writeFile(wb, `knowledge-graph-${Date.now()}.xlsx`);
  } else if (format === 'json') {
    const dataStr = JSON.stringify(graphData.value, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `knowledge-graph-${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }
};

// Load Initial Data
onMounted(async () => {
  try {
    // Load test data from public folder
    const elementsCsv = await d3.csv('/kumu-ungg-test/Elements-表格 1.csv');
    const connectionsCsv = await d3.csv('/kumu-ungg-test/Connections-表格 1.csv');

    const nodes: GraphNode[] = elementsCsv.map(d => ({
      id: d.Label || d['﻿Label'] || 'Unknown', // Handle potential BOM or different headers
      label: d.Label || d['﻿Label'] || 'Unknown',
      type: d.Type,
      image: d.Image,
      description: d.Description,
      ...d
    })).filter(n => n.id);

    const links: GraphLink[] = connectionsCsv.map(d => ({
      source: d.From || '',
      target: d.To || '',
      type: d.Type,
      Direction: d.Direction, // Ensure Direction is read
      ...d
    })).filter(l => l.source && l.target) as unknown as GraphLink[];

    // Deduplicate nodes if necessary
    const uniqueNodes = Array.from(new Map(nodes.map(n => [n.id, n])).values());

    graphData.value = {
      nodes: uniqueNodes,
      links: links
    };
  } catch (error) {
    console.error('Failed to load data:', error);
  }
});
</script>

<style scoped>
.mindmap-page {
  display: flex;
  flex-direction: column;
  height: 95vh;
  width: 100vw;
  background-color: #f8f9fa;
}

.header {
  height: 60px;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  z-index: 10;
}

.left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  padding: 8px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
}

.back-btn:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.content-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.mindmap-container {
  display: flex;
  width: 100%;
  height: 100vh;
  position: relative; /* Ensure absolute children are relative to this */
  overflow: hidden;
}

.canvas-wrapper {
  flex: 1;
  background-color: #f8f9fa;
  position: relative;
  overflow: hidden;
}

.sidebar-wrapper {
  width: 320px;
  background-color: white;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  z-index: 5;
}

.fab-container {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 100;
}

.legend-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  z-index: 10;
  max-height: 200px;
  pointer-events: auto; /* Ensure clicks work */
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
  gap: 12px;
}
</style>