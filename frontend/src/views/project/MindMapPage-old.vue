<!--
  MindMapPage.vue - 思维导图页面

  功能：
  1. 图谱可视化展示
  2. 节点和关系的交互操作
  3. 图谱数据管理（导入/导出）
  4. 图谱配置和设置

  主要特性：
  - 基于D3.js的力导向图实现
  - 可视化配置面板（GraphSidebar）
  - 节点和关系的增删改查操作
  - 数据导入导出功能
  - 响应式布局设计
-->
<template>
  <div class="mindmap-page">

    <div class="content-container">
      <!-- Main Graph Canvas -->
      <div class="canvas-wrapper" ref="canvasWrapper">
        <!-- 图谱画布组件，负责图谱的渲染和交互 -->
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
        <div v-else-if="loading" class="loading-state">
          <Loader2 class="animate-spin" :size="32" />
          <span>加载中...</span>
        </div>
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
        <!-- 图谱侧边栏组件，包含节点详情、配置选项和数据管理 -->
        <GraphSidebar 
          :selected-node="selectedNode"
          :nodes="graphData.nodes"
          :graph-stats="{ nodes: graphData.nodes.length, links: graphData.links.length }"
          :available-tables="availableTables"
          :relationship-fields="relationshipFields"
          @update-config="updateConfig"
          @import-data="handleImportData"
          @export-data="handleExportData"
          @update-table-mapping="updateTableMapping"
        />
      </div>

      <!-- Floating Action Button -->
      <div class="fab-container">
        <!-- 浮动操作按钮菜单，提供快速添加节点、关系和导入数据功能 -->
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
      <!-- 添加节点对话框，用于创建新的图谱节点 -->
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
      <!-- 添加关系对话框，用于创建节点间的关系 -->
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
      <!-- 图例面板，显示节点类型与颜色的对应关系 -->
      <GraphLegend :types="uniqueTypes" />
      
      <!-- Placing Node Hint -->
      <!-- 节点放置提示，指导用户在画布上放置新节点 -->
      <div v-if="placingNode" class="placing-hint">
        <p>点击画布以放置实体: <strong>{{ newNodeForm.label }}</strong></p>
        <button @click="cancelPlaceNode">取消</button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeft, Loader2, Plus, X, PlusCircle, Share2, Upload } from 'lucide-vue-next';
import { ElMessage } from 'element-plus';
import GraphCanvas from '@/components/visualizers/Graph/GraphCanvas.vue';
import GraphSidebar from '@/components/visualizers/Graph/GraphSidebar.vue';
import GraphLegend from '@/components/visualizers/Graph/GraphLegend.vue';
import * as d3 from 'd3';
import { toPng } from 'html-to-image';
import * as XLSX from 'xlsx';
import { useMapStore } from '@/stores/mapStore';
import { storeToRefs } from 'pinia';
import type { VisualEntity, BaseItem } from '@/types/entity';
import type { ProjectSchema } from '@/types/schema';
import { FieldType } from '@/types/schema';
import { parseCSV } from '@/core/services/fileUploadService';

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
  direction?: string; // 添加direction属性支持
  [key: string]: any;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface TableInfo {
  id: string;
  name: string;
  type?: 'entity' | 'relationship';
}

// Store
const mapStore = useMapStore();
const { entities } = storeToRefs(mapStore);

// State
// 图谱数据状态，包含所有节点和关系
const graphData = ref<GraphData>({ nodes: [], links: [] });
const loading = ref(true);

// 表格映射状态
const tableMapping = ref<Record<string, 'entity' | 'relationship'>>({});
const availableTables = ref<TableInfo[]>([]);

// 关系字段映射
const relationshipFields = ref({
  source: '',
  target: '',
  type: ''
});

// 当前项目ID (从路由获取)
const currentProjectId = ref<number | null>(null);

// 临时存储上传的数据
const tempNodes = ref<any[]>([]);
const tempLinks = ref<any[]>([]);

// Transform VisualEntity[] to GraphData
const updateGraphData = () => {
  // 如果没有实体数据，直接返回空图谱
  if (entities.value.length === 0) {
    graphData.value = { nodes: [], links: [] };
    return;
  }

  // 根据表格映射过滤节点数据
  const entityTables = Object.keys(tableMapping.value).filter(key => tableMapping.value[key] === 'entity');
  const relationshipTables = Object.keys(tableMapping.value).filter(key => tableMapping.value[key] === 'relationship');
  
  // 如果没有明确映射，默认将Elements作为实体，Connections作为关系
  const nodes: GraphNode[] = entities.value
    .filter(e => {
      // 根据表格映射过滤，如果没有映射则默认包含所有
      if (entityTables.length > 0) {
        // 这里应该根据实体来源过滤，暂时简化处理
        return true;
      }
      return true;
    })
    .map(e => {
      // 尝试从data中提取label
      let label = '未命名';
      if (e.data.label) {
        label = e.data.label;
      } else if (e.data.Label) {
        label = e.data.Label;
      } else if (e.data.name) {
        label = e.data.name;
      } else if (e.primaryLabel && e.primaryLabel !== '未命名') {
        label = e.primaryLabel;
      } else if (e.data.名称) {
        label = e.data.名称;
      }
      
      return {
        id: e.id,
        label: label,
        type: (e.data.type || e.data.Type || e.data.category || e.data.行业 || 'Unknown') as string,
        image: e.data.image as string,
        description: e.data.description as string,
        ...e.data,
        // Keep existing simulation state if available
        x: graphData.value.nodes.find(n => n.id === e.id)?.x,
        y: graphData.value.nodes.find(n => n.id === e.id)?.y,
      };
    });

  // 构建关系数据
  const links: GraphLink[] = [];
  
  console.log('[updateGraphData] 开始构建关系数据');
  console.log('[updateGraphData] tempLinks数量:', tempLinks.value.length);
  console.log('[updateGraphData] nodes数量:', nodes.length);
  
  // 处理存储在tempLinks中的关系数据
  if (tempLinks.value.length > 0) {
    console.log('[updateGraphData] 使用tempLinks构建关系');
    tempLinks.value.forEach((linkData: any, index: number) => {
      console.log(`[updateGraphData] 处理关系 ${index}:`, linkData);
      
      // 查找源节点和目标节点 - 改进匹配逻辑
      const sourceNode = nodes.find(node => {
        const match = 
          node.id === linkData.source || 
          node.label === linkData.source || 
          node.Label === linkData.source ||
          node.名称 === linkData.source ||
          // 也尝试匹配原始数据中的字段
          (node as any)[linkData.source] !== undefined;
        
        if (match) {
          console.log(`  找到源节点: ${node.id} (label: ${node.label})`);
        }
        return match;
      });
      
      const targetNode = nodes.find(node => {
        const match =
          node.id === linkData.target || 
          node.label === linkData.target || 
          node.Label === linkData.target ||
          node.名称 === linkData.target ||
          (node as any)[linkData.target] !== undefined;
        
        if (match) {
          console.log(`  找到目标节点: ${node.id} (label: ${node.label})`);
        }
        return match;
      });
      
      if (sourceNode && targetNode) {
        const link = {
          source: sourceNode.id,
          target: targetNode.id,
          type: linkData.type || linkData.Type || 'Unknown',
          Direction: linkData.Direction || linkData.direction || 'directed',
          direction: linkData.Direction || linkData.direction || 'directed',
          id: `${sourceNode.id}-${targetNode.id}-${linkData.type || linkData.Type || 'Unknown'}`
        };
        links.push(link);
        console.log(`  ✓ 成功创建关系:`, link);
      } else {
        console.warn(`  ✗ 未找到节点 - source: ${linkData.source} (${sourceNode ? '找到' : '未找到'}), target: ${linkData.target} (${targetNode ? '找到' : '未找到'})`);
      }
    });
  }
  // 如果有明确的关系表映射
  else if (relationshipTables.length > 0) {
    entities.value.forEach(e => {
      // 查找被标记为关系的数据表
      if (relationshipTables.includes('connections')) { // 简化处理
        if (e.links) {
          e.links.forEach(l => {
            // Ensure target exists
            if (entities.value.some(target => target.id === l.targetId)) {
              links.push({
                source: e.id,
                target: l.targetId,
                type: l.relationType,
                // 修复关系方向硬编码问题，从数据中获取方向信息
                Direction: l.direction || 'directed', // 默认为有向
                direction: l.direction || 'directed', // 同时保留direction字段
                id: `${e.id}-${l.targetId}-${l.relationType}` // 改进ID生成方式，加入关系类型避免冲突
              });
            }
          });
        }
      }
    });
  } else {
    // 默认处理关系 - 检查entities中是否包含关系数据
    entities.value.forEach(e => {
      // 如果实体有links属性，则处理为关系
      if (e.links) {
        e.links.forEach(l => {
          // Ensure target exists
          if (entities.value.some(target => target.id === l.targetId)) {
            links.push({
              source: e.id,
              target: l.targetId,
              type: l.relationType,
              Direction: l.direction || 'directed',
              direction: l.direction || 'directed',
              id: `${e.id}-${l.targetId}-${l.relationType}`
            });
          }
        });
      }
      // 如果实体本身看起来像关系数据（有From/To字段），则也处理为关系
      else if (e.data.From && e.data.To) {
        // 查找源节点和目标节点
        const sourceNode = entities.value.find(node => node.id === e.data.From || node.data.label === e.data.From || node.data.Label === e.data.From);
        const targetNode = entities.value.find(node => node.id === e.data.To || node.data.label === e.data.To || node.data.Label === e.data.To);
        
        if (sourceNode && targetNode) {
          links.push({
            source: sourceNode.id,
            target: targetNode.id,
            type: e.data.Type || e.data.type || 'Unknown',
            Direction: e.data.Direction || e.data.direction || 'directed',
            direction: e.data.Direction || e.data.direction || 'directed',
            id: `${sourceNode.id}-${targetNode.id}-${e.data.Type || e.data.type || 'Unknown'}`
          });
        }
      }
    });
  }

  console.log('转换后的节点:', nodes);
  console.log('转换后的关系:', links);
  console.log('图谱数据更新，节点数:', nodes.length, '关系数:', links.length);

  graphData.value = { nodes, links };
};

// Watch for entity changes
watch(entities, () => {
  updateGraphData();
  loading.value = false;
}, { deep: true, immediate: true });

// 添加一个计算属性来检查是否有数据
const hasData = computed(() => {
  return entities.value.length > 0;
});

const hasGraphData = computed(() => {
  return graphData.value.nodes.length > 0;
});

// 当前选中的节点和关系
const selectedNode = ref<GraphNode | null>(null);
const selectedLink = ref<GraphLink | null>(null);

// 图谱配置状态，控制图谱的可视化效果
const graphConfig = ref({
  nodeColorBy: 'type', // Changed to lowercase to match data key convention usually
  showImages: true,
  forceStrength: -2,
  physicsEnabled: true,
  nodeSizeByLinks: true,
  minNodeRadius: 4,
  maxNodeRadius: 20,
  centerForce: 1,
  collideStrength: 0.1,
  nodeLabelField: "名称" // 添加节点标签字段配置
});

// Color Scale
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

// 计算唯一节点类型，用于图例展示
const uniqueTypes = computed(() => {
  const types = new Set(graphData.value.nodes.map(n => n.type || 'Unknown'));
  return Array.from(types);
});

// FAB State
// 浮动按钮菜单状态
const showFabMenu = ref(false);
const showAddNodeModal = ref(false);
const showAddLinkModal = ref(false);
const placingNode = ref(false);

// 连线模式状态
const linkingMode = ref(false);
const linkingSourceNode = ref<GraphNode | null>(null);

// 新节点表单数据
const newNodeForm = reactive({
  label: '',
  type: '',
  image: '',
  description: ''
});

// 新关系表单数据
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

// 更新表格映射
const updateTableMapping = async (mapping: { tableId: string, type: 'entity' | 'relationship' }) => {
  // 重置之前的同类型映射
  Object.keys(tableMapping.value).forEach(key => {
    if (tableMapping.value[key] === mapping.type) {
      delete tableMapping.value[key];
    }
  });
  
  // 设置新的映射
  tableMapping.value[mapping.tableId] = mapping.type;
  
  // 更新表格信息
  availableTables.value = availableTables.value.map(table => ({
    ...table,
    type: tableMapping.value[table.id]
  }));
  
  // 如果是关系表格,自动识别关系字段
  if (mapping.type === 'relationship') {
    await detectRelationshipFields(mapping.tableId);
  }
  
  // 更新图谱数据
  updateGraphData();
};

// 自动识别关系字段
const detectRelationshipFields = async (tableId: string) => {
  try {
    // 从后端获取表格数据的第一行,用于分析字段
    if (!currentProjectId.value) return;
    
    const response = await fetch(`http://localhost:8001/api/items?projectId=${currentProjectId.value}&tableId=${tableId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    
    if (!response.ok) {
      console.error('获取表格数据失败');
      return;
    }
    
    const items = await response.json();
    if (items.length === 0) {
      console.warn('表格数据为空');
      return;
    }
    
    // 获取第一行数据的字段名
    const firstItem = items[0];
    const headers = Object.keys(firstItem.data || firstItem);
    
    // 自动识别关系字段
    const fields = autoDetectRelationshipFields(headers);
    relationshipFields.value = fields;
    
    console.log('自动识别的关系字段:', fields);
  } catch (error) {
    console.error('识别关系字段失败:', error);
  }
};

// 自动识别关系字段的辅助函数
const autoDetectRelationshipFields = (headers: string[]) => {
  const fields: { source: string; target: string; type: string } = {
    source: '',
    target: '',
    type: ''
  };
  
  // 常见的源节点字段名
  const sourceFieldNames = ['From', 'from', 'source', 'Source', 'Start', 'start', '起点', '源', 'src'];
  // 常见的目标节点字段名
  const targetFieldNames = ['To', 'to', 'target', 'Target', 'End', 'end', '终点', '目标', 'dest', 'dst'];
  // 常见的关系类型字段名
  const typeFieldNames = ['Type', 'type', 'Relation', 'relation', 'Relationship', 'relationship', '类型', '关系', 'Label', 'label'];
  
  headers.forEach(header => {
    if (sourceFieldNames.includes(header) && !fields.source) {
      fields.source = header;
    }
    if (targetFieldNames.includes(header) && !fields.target) {
      fields.target = header;
    }
    if (typeFieldNames.includes(header) && !fields.type) {
      fields.type = header;
    }
  });
  
  return fields;
};

// 从后端加载项目的表格列表
const loadProjectTables = async (projectId: number) => {
  try {
    const response = await fetch(`http://localhost:8001/api/projects/${projectId}/tables`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    
    if (!response.ok) {
      console.error('获取表格列表失败');
      return;
    }
    
    const tables = await response.json();
    availableTables.value = tables.map((table: any) => ({
      id: table.id.toString(),
      name: table.name,
      type: tableMapping.value[table.id.toString()]
    }));
    
    console.log('加载的表格列表:', availableTables.value);
    
    // 加载表格数据
    await loadProjectData(projectId);
  } catch (error) {
    console.error('加载表格列表失败:', error);
  }
};

// 从项目的表格中加载数据
const loadProjectData = async (projectId: number) => {
  try {
    loading.value = true;
    console.log('[loadProjectData] 开始加载项目数据, projectId:', projectId);
    
    // 获取项目的所有items
    const response = await fetch(`http://localhost:8001/api/items?projectId=${projectId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    
    if (!response.ok) {
      console.error('获取项目数据失败');
      loading.value = false;
      return;
    }
    
    const items = await response.json();
  
    
    if (items.length === 0) {
      ElMessage.warning('项目中没有数据');
      loading.value = false;
      return;
    }
    
    // 分析数据,区分实体和关系
    const nodes: any[] = [];
    const links: any[] = [];
    
    items.forEach((item: any) => {
      const data = item.data || item;
      
      // 检查是否是关系数据(有From/To字段)
      const hasFrom = data.From || data.from || data.source || data.Source;
      const hasTo = data.To || data.to || data.target || data.Target;
      
      if (hasFrom && hasTo) {
        // 这是关系数据
        links.push({
          source: data.From || data.from || data.source || data.Source,
          target: data.To || data.to || data.target || data.Target,
          type: data.Type || data.type || 'Unknown',
          Direction: data.Direction || data.direction || 'directed',
          direction: data.Direction || data.direction || 'directed',
          ...data
        });
      } else {
        // 这是实体数据
        const nodeId = data.Label || data.label || data.名称 || data.name || data.id || item.id;
        nodes.push({
          id: nodeId,
          label: data.Label || data.label || data.名称 || data.name || nodeId,
          type: data.Type || data.type || data.行业 || data.category || 'Unknown',
          image: data.Image || data.image,
          description: data.Description || data.description,
          ...data
        });
      }
    });
    
    console.log('[loadProjectData] 解析后的nodes数量:', nodes.length);
    console.log('[loadProjectData] 解析后的links数量:', links.length);
    
    if (nodes.length === 0) {
      ElMessage.warning('项目中没有实体数据');
      loading.value = false;
      return;
    }
    
    // 导入数据到图谱
    handleImportData({ nodes, links });
    
    ElMessage.success(`成功加载 ${nodes.length} 个节点和 ${links.length} 个关系`);
    loading.value = false;
  } catch (error) {
    console.error('[loadProjectData] 加载项目数据失败:', error);
    ElMessage.error('加载项目数据失败: ' + (error as Error).message);
    loading.value = false;
  }
};

// 检查并触发导入事件
const checkAndEmitImport = () => {
  // 如果节点和关系数据都已准备好，则触发导入
  if (tempNodes.value.length > 0) {
    const data = {
      nodes: tempNodes.value,
      links: tempLinks.value
    };
    
    handleImportData(data);
    
    // 清空临时数据
    tempNodes.value = [];
    tempLinks.value = [];
  }
};

// 处理文件上传 - 节点
const handleUploadNodes = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const text = await file.text();
  const data = d3.csvParse(text);
  
  // Map to standard format
  const nodes = data.map((d: any) => ({
    id: d.Label || d['﻿Label'] || d.id || 'Unknown',
    label: d.Label || d['﻿Label'] || d.label || 'Unknown',
    type: d.Type || d.type,
    image: d.Image || d.image,
    description: d.Description || d.description,
    ...d
  })).filter((n: any) => n.id);
  
  tempNodes.value = nodes;
  checkAndEmitImport();
};

// 处理文件上传 - 关系
const handleUploadLinks = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const text = await file.text();
  const data = d3.csvParse(text);

  const links = data.map((d: any) => ({
    source: d.From || d.source,
    target: d.To || d.target,
    type: d.Type || d.type,
    Direction: d.Direction || d.direction || 'directed',
    direction: d.Direction || d.direction || 'directed',
    ...d
  })).filter((l: any) => l.source && l.target);

  tempLinks.value = links;
  checkAndEmitImport();
};

const openAddLinkModal = () => {
  // 启动连线模式
  linkingMode.value = true;
  linkingSourceNode.value = null;
  showFabMenu.value = false;
  ElMessage.info('连线模式已启动,请点击源节点,然后点击目标节点');
};

const triggerImport = () => {
  // 检查URL参数，如果包含测试参数则加载默认测试数据
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('test') === 'kumu') {
    loadDefaultTestData();
  } else {
    showImportTip();
  }
  showFabMenu.value = false;
};

const showImportTip = () => {
  ElMessage.info({
    message: '请在右侧侧边栏的"数据"标签页中导入CSV文件，或者点击"加载测试数据"按钮查看示例。',
    duration: 5000,
    showClose: true
  });
};

const cancelPlaceNode = () => {
  placingNode.value = false;
};

const cancelLinkingMode = () => {
  linkingMode.value = false;
  linkingSourceNode.value = null;
  ElMessage.info('已取消连线模式');
};

const handleNodeClick = (node: GraphNode) => {
  if (placingNode.value) return;
  
  // 连线模式处理
  if (linkingMode.value) {
    if (!linkingSourceNode.value) {
      // 第一次点击,选择源节点
      linkingSourceNode.value = node;
      ElMessage.success(`已选择源节点: ${node.label},请点击目标节点`);
    } else {
      // 第二次点击,选择目标节点并创建连线
      if (linkingSourceNode.value.id === node.id) {
        ElMessage.warning('源节点和目标节点不能相同');
        return;
      }
      
      // 创建新连线
      createNewLink(linkingSourceNode.value, node);
      
      // 退出连线模式
      linkingMode.value = false;
      linkingSourceNode.value = null;
    }
    return;
  }
  
  selectedNode.value = node;
  selectedLink.value = null;
};

const handleLinkClick = (link: GraphLink) => {
  if (placingNode.value) return;
  selectedLink.value = link;
  selectedNode.value = null;
};

// 确保项目有关系表
const ensureRelationshipTable = async (projectId: number): Promise<number> => {
  try {
    // 检查是否已有关系表
    const existingTable = availableTables.value.find(t => 
      t.name.toLowerCase() === 'relationships' || 
      t.name.toLowerCase() === '关系' ||
      t.type === 'relationship'
    );
    
    if (existingTable) {
      console.log('[ensureRelationshipTable] 使用现有关系表:', existingTable.id);
      return parseInt(existingTable.id);
    }
    
    // 创建新的关系表
    console.log('[ensureRelationshipTable] 创建新的关系表');
    // 不发送schema,让后端自动生成默认schema
    
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
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || '创建关系表失败');
    }
    
    const newTable = await response.json();
    console.log('[ensureRelationshipTable] 创建成功:', newTable);
    
    // 更新表格列表
    availableTables.value.push({
      id: newTable.id.toString(),
      name: newTable.name,
      type: 'relationship'
    });
    
    // 更新表格映射
    tableMapping.value[newTable.id.toString()] = 'relationship';
    
    ElMessage.success('已自动创建关系表');
    return newTable.id;
  } catch (error) {
    console.error('[ensureRelationshipTable] 失败:', error);
    ElMessage.error('创建关系表失败: ' + (error as Error).message);
    throw error;
  }
};

// 创建新连线
const createNewLink = async (sourceNode: GraphNode, targetNode: GraphNode) => {
  try {
    if (!currentProjectId.value) {
      ElMessage.error('未找到项目ID');
      return;
    }
    
    console.log('[createNewLink] 创建连线:', sourceNode.label, '->', targetNode.label);
    
    // 确保有关系表
    const tableId = await ensureRelationshipTable(currentProjectId.value);
    
    // 创建关系数据
    const relationshipData = {
      From: sourceNode.label,
      To: targetNode.label,
      Type: '关联', // 默认类型
      Direction: 'directed',
      Description: '',
      CreatedAt: new Date().toISOString()
    };
    
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
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || '保存关系失败');
    }

    const savedItem = await response.json();

    // 添加到临时links中
    tempLinks.value.push({
      source: sourceNode.id,
      target: targetNode.id,
      type: relationshipData.Type,
      direction: relationshipData.Direction,
      ...relationshipData
    });
    
    // 更新图谱
    updateGraphData();
    
    ElMessage.success(`已创建连线: ${sourceNode.label} → ${targetNode.label}`);
  } catch (error) {
    console.error('[createNewLink] 失败:', error);
    ElMessage.error('创建连线失败: ' + (error as Error).message);
  }
};

const confirmAddNode = () => {
  if (!newNodeForm.label) return;
  
  // Use mapStore to add item
  const newItem = {
    id: newNodeForm.label, // or generate UUID
    data: {
      label: newNodeForm.label,
      type: newNodeForm.type,
      image: newNodeForm.image,
      description: newNodeForm.description
    }
  };
  
  mapStore.addItem(newItem);
  
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
  
  // Alert user that this feature requires backend support for now
  alert("添加关系功能需要后端支持或明确的数据结构定义。");
  
  showAddLinkModal.value = false;
};

const updateConfig = (newConfig: any) => {
  graphConfig.value = newConfig;
};

const handleImportData = (data: { nodes: any[], links: any[] }) => {
  // Convert graph data to BaseItem[] format for mapStore
  const items: BaseItem[] = data.nodes.map(node => ({
    id: node.id,
    data: { ...node }
  }));
  
  // Create a basic schema for the imported data
  const schema: ProjectSchema = {
    fields: [
      { key: 'label', label: '标签', type: FieldType.TEXT, is_primary: true },
      { key: 'type', label: '类型', type: FieldType.TEXT },
      { key: 'description', label: '描述', type: FieldType.TEXT },
      { key: 'image', label: '图片', type: FieldType.TEXT }
    ]
  };
  
  // Load items into the store
  mapStore.loadItems(items, schema);
  console.log('[handleImportData] 已加载items到store');
  
  // 处理关系数据 - 将关系数据存储在临时变量中
  tempLinks.value = data.links;
  console.log('[handleImportData] 已设置tempLinks:', tempLinks.value.length);
  console.log('[handleImportData] watch(entities)会自动触发updateGraphData');
  
  ElMessage.success('数据导入成功');
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

// 加载默认测试数据
const loadDefaultTestData = async () => {
  try {
    loading.value = true;
    // 加载实体数据
    const elementsResponse = await fetch('/kumu-ungg-test/Elements-表格 1.csv');
    const elementsText = await elementsResponse.text();
    const elementsData = d3.csvParse(elementsText);
    
    const nodes = elementsData.map((d: any, index: number) => ({
      id: d.Label || d['﻿Label'] || d.id || `node-${Date.now()}-${index}`,
      label: d.Label || d['﻿Label'] || d.label || d.名称 || 'Unknown',
      type: d.Type || d.type || d.行业 || 'Unknown',
      image: d.Image || d.image,
      description: d.Description || d.description,
      ...d
    })).filter((n: any) => n.id && n.id !== 'Unknown');
    
    // 加载关系数据
    const connectionsResponse = await fetch('/kumu-ungg-test/Connections-表格 1.csv');
    const connectionsText = await connectionsResponse.text();
    const connectionsData = d3.csvParse(connectionsText);
    
    const links = connectionsData.map((d: any) => ({
      source: d.From || d.source,
      target: d.To || d.target,
      type: d.Type || d.type,
      Direction: d.Direction || d.direction || 'directed',
      direction: d.Direction || d.direction || 'directed',
      ...d
    })).filter((l: any) => l.source && l.target);
    
    console.log('[loadDefaultTestData] 加载的节点数量:', nodes.length);
    console.log('[loadDefaultTestData] 加载的关系数量:', links.length);
    console.log('[loadDefaultTestData] 前3个节点:', nodes.slice(0, 3));
    console.log('[loadDefaultTestData] 前3个关系:', links.slice(0, 3));
    
    // 发送数据到图谱
    handleImportData({ nodes, links });
    
    ElMessage.success('测试数据加载成功');
    loading.value = false;
  } catch (error) {
    console.error('加载测试数据失败:', error);
    ElMessage.error('加载测试数据失败: ' + (error as Error).message);
    loading.value = false;
  }
};

onMounted(async () => {
  // 从路由获取项目ID
  const route = useRoute();
  const projectId = route.query.projectId;
  
  if (projectId) {
    currentProjectId.value = parseInt(projectId as string);
    // 加载项目的表格列表
    await loadProjectTables(currentProjectId.value);
  }
  
  // 检查URL参数，如果包含测试参数则加载默认测试数据
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('test') === 'kumu') {
    loadDefaultTestData();
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
  gap: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
}

.empty-icon {
  margin-bottom: 16px;
  color: #d1d5db;
}

.empty-state p {
  margin-bottom: 24px;
  font-size: 16px;
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
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.import-btn.primary {
  background-color: #3b82f6;
  color: white;
}

.import-btn.primary:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.import-btn.secondary {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.import-btn.secondary:hover {
  background-color: #e5e7eb;
  border-color: #d1d5db;
}

/* 连线模式提示 */
.linking-mode-hint {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.hint-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  font-size: 14px;
  font-weight: 500;
}

.hint-content span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cancel-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

</style>
