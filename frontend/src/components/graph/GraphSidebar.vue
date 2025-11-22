<template>
  <div class="graph-sidebar">
    <!-- Tabs -->
    <div class="tabs">
      <button 
        v-for="tab in ['details', 'settings', 'data']" 
        :key="tab"
        class="tab-btn"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ tab === 'details' ? '详情' : tab === 'settings' ? '设置' : '数据' }}
      </button>
    </div>

    <!-- Content -->
    <div class="tab-content custom-scrollbar">
      
      <!-- Details Tab -->
      <div v-if="activeTab === 'details'" class="details-panel">
        <div v-if="selectedNode" class="node-info">
          <div v-if="selectedNode.image" class="node-image-wrapper">
            <img :src="selectedNode.image" alt="Node Image" class="node-image" />
          </div>
          <h2 class="node-title">{{ selectedNode.label }}</h2>
          <div class="node-meta">
            <span class="badge" v-if="selectedNode.type">{{ selectedNode.type }}</span>
            <span class="id-text">ID: {{ selectedNode.id }}</span>
          </div>
          
          <div v-if="selectedNode.description" class="node-description">
            <h3>描述</h3>
            <p>{{ selectedNode.description }}</p>
          </div>

          <div v-if="selectedNode.tags" class="node-tags">
            <h3>标签</h3>
            <div class="tag-list">
              <span v-for="tag in selectedNode.tags.split(',')" :key="tag" class="tag">
                {{ tag.trim() }}
              </span>
            </div>
          </div>
          
          <!-- Raw Properties -->
          <div class="raw-props">
             <h3>所有属性</h3>
             <div v-for="(val, key) in filterProps(selectedNode)" :key="key" class="prop-row">
               <span class="prop-key">{{ key }}:</span>
               <span class="prop-val">{{ val }}</span>
             </div>
          </div>

        </div>
        <div v-else class="empty-state">
          <p>请点击图谱中的节点查看详情</p>
        </div>
      </div>

      <!-- Settings Tab -->
      <div v-if="activeTab === 'settings'" class="settings-panel">
        <div class="setting-group">
          <label>物理引擎 (Physics)</label>
          <div class="toggle-wrapper">
            <input 
              type="checkbox" 
              :checked="localConfig.physicsEnabled" 
              @change="handlePhysicsToggle" 
            />
            <span>{{ localConfig.physicsEnabled ? '已开启' : '已关闭 (手动布局)' }}</span>
          </div>
        </div>

        <div class="setting-group">
          <label>着色字段 (Color By)</label>
          <select v-model="localConfig.nodeColorBy" @change="emitConfig">
            <option value="Type">类型 (Type)</option>
            <option value="group">分组 (Group)</option>
            <option value="category">分类 (Category)</option>
          </select>
        </div>

        <div class="setting-group">
          <label>显示图片</label>
          <div class="toggle-wrapper">
            <input type="checkbox" v-model="localConfig.showImages" @change="emitConfig" />
            <span>启用节点图片</span>
          </div>
        </div>

        <div class="setting-group">
          <label>节点大小映射</label>
          <div class="toggle-wrapper">
            <input type="checkbox" v-model="localConfig.nodeSizeByLinks" @change="emitConfig" />
            <span>根据链接数量调整大小</span>
          </div>
        </div>

        <div v-if="localConfig.nodeSizeByLinks" class="setting-subgroup">
          <label>最小节点半径</label>
          <input 
            type="range" 
            min="4" 
            max="12" 
            step="2" 
            v-model.number="localConfig.minNodeRadius" 
            @input="emitConfig" 
          />
          <span class="value-display">{{ localConfig.minNodeRadius }}px</span>
        </div>

        <div v-if="localConfig.nodeSizeByLinks" class="setting-subgroup">
          <label>最大节点半径</label>
          <input 
            type="range" 
            min="20" 
            max="40" 
            step="5" 
            v-model.number="localConfig.maxNodeRadius" 
            @input="emitConfig" 
          />
          <span class="value-display">{{ localConfig.maxNodeRadius }}px</span>
        </div>

        <h3 class="section-title">力参数调整</h3>

        <div class="setting-group">
          <label>排斥力 (Charge Force)</label>
          <input 
            type="range" 
            min="-200" 
            max="50" 
            step="10" 
            v-model.number="localConfig.forceStrength" 
            @input="emitConfig" 
          />
          <span class="value-display">{{ localConfig.forceStrength }}</span>
        </div>

        <div class="setting-group">
          <label>中心力强度 (Center Force)</label>
          <input 
            type="range" 
            min="0" 
            max="2" 
            step="0.1" 
            v-model.number="localConfig.centerForce" 
            @input="emitConfig" 
          />
          <span class="value-display">{{ localConfig.centerForce }}</span>
        </div>

        <div class="setting-group">
          <label>碰撞半径 (Collision Radius)</label>
          <input 
            type="range" 
            min="20" 
            max="80" 
            step="5" 
            v-model.number="localConfig.collideRadius" 
            @input="emitConfig" 
          />
          <span class="value-display">{{ localConfig.collideRadius }}px</span>
        </div>

        <div class="setting-group">
          <label>碰撞力强度 (Collision Strength)</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            v-model.number="localConfig.collideStrength" 
            @input="emitConfig" 
          />
          <span class="value-display">{{ localConfig.collideStrength }}</span>
        </div>
      </div>

      <!-- Data Tab -->
      <div v-if="activeTab === 'data'" class="data-panel">
        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-val">{{ graphStats.nodes }}</span>
            <span class="stat-label">节点</span>
          </div>
          <div class="stat-item">
            <span class="stat-val">{{ graphStats.links }}</span>
            <span class="stat-label">关系</span>
          </div>
        </div>

        <div class="action-group">
          <h3>导入数据</h3>
          <p class="help-text">支持 CSV 格式 (Elements.csv, Connections.csv)</p>
          <div class="file-input-wrapper">
            <label class="btn-secondary">
              上传节点 (Elements)
              <input type="file" accept=".csv" @change="handleUploadNodes" hidden />
            </label>
            <label class="btn-secondary">
              上传关系 (Connections)
              <input type="file" accept=".csv" @change="handleUploadLinks" hidden />
            </label>
          </div>
        </div>

        <div class="action-group">
          <h3>导出数据</h3>
          <button class="btn-primary" @click="$emit('export-data', 'png')">导出图片 (PNG)</button>
          <button class="btn-secondary" @click="$emit('export-data', 'excel')">导出 Excel</button>
          <button class="btn-secondary" @click="$emit('export-data', 'json')">导出 JSON</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import * as d3 from 'd3';

const props = defineProps<{
  selectedNode: any;
  graphStats: { nodes: number, links: number };
}>();

const emit = defineEmits(['update-config', 'import-data', 'export-data']);

const activeTab = ref('details');

// 初始的设置参数
const localConfig = reactive({
  nodeColorBy: 'Type',
  showImages: true,
  forceStrength: -2,
  physicsEnabled: true,
  nodeSizeByLinks: true,
  minNodeRadius: 4,
  maxNodeRadius: 20,
  centerForce: 1,
  collideRadius: 40,
  collideStrength: 0.1
});

const emitConfig = () => {
  emit('update-config', { ...localConfig });
};

const handlePhysicsToggle = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const newValue = target.checked;

  if (newValue) {
    // Turning ON
    if (confirm('开启物理引擎可能会打散您手动调整的布局，确定要开启吗？')) {
      localConfig.physicsEnabled = true;
      emitConfig();
    } else {
      // Revert checkbox
      target.checked = false;
    }
  } else {
    // Turning OFF
    localConfig.physicsEnabled = false;
    emitConfig();
  }
};

// Helper to filter internal props
const filterProps = (node: any) => {
  const { id, label, x, y, vx, vy, index, image, description, tags, ...rest } = node;
  return rest;
};

// File Handling
const tempNodes = ref<any[]>([]);
const tempLinks = ref<any[]>([]);

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

const handleUploadLinks = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const text = await file.text();
  const data = d3.csvParse(text);

  const links = data.map((d: any) => ({
    source: d.From || d.source,
    target: d.To || d.target,
    type: d.Type || d.type,
    ...d
  })).filter((l: any) => l.source && l.target);

  tempLinks.value = links;
  checkAndEmitImport();
};

const checkAndEmitImport = () => {
  if (tempNodes.value.length > 0) {
    // If links are not uploaded yet, just emit nodes (links will be empty or previous?)
    // For simplicity, we emit what we have. If user uploads both, they should do it sequentially or we need a better UI.
    // Here we assume additive or replacement? Let's assume replacement for now.
    emit('import-data', {
      nodes: tempNodes.value,
      links: tempLinks.value
    });
  }
};
</script>

<style scoped>
.graph-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-size: 14px;
  color: #333;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
}

.tab-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* Details Panel */
.node-image-wrapper {
  width: 100%;
  height: 160px;
  background-color: #f3f4f6;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.node-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.node-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 700;
}

.node-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
}

.badge {
  background-color: #e5e7eb;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #4b5563;
}

.id-text {
  font-size: 12px;
  color: #9ca3af;
}

.node-description {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 6px;
}

.node-description h3, .node-tags h3, .raw-props h3 {
  margin: 0 0 8px 0;
  font-size: 12px;
  text-transform: uppercase;
  color: #9ca3af;
}

.node-description p {
  margin: 0;
  line-height: 1.5;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.tag {
  background-color: #eff6ff;
  color: #2563eb;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.prop-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #f3f4f6;
}

.prop-key {
  color: #6b7280;
}

.prop-val {
  font-weight: 500;
  text-align: right;
}

.empty-state {
  text-align: center;
  color: #9ca3af;
  margin-top: 40px;
}

/* Settings Panel */
.setting-group {
  margin-bottom: 20px;
}

.setting-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.setting-group select, .setting-group input[type="range"] {
  width: 100%;
}

.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.value-display {
  display: block;
  text-align: right;
  font-size: 12px;
  color: #6b7280;
}

/* Data Panel */
.stats-card {
  display: flex;
  background-color: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-val {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

.action-group {
  margin-bottom: 24px;
}

.action-group h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.help-text {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 12px;
}

.file-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-primary, .btn-secondary {
  display: block;
  width: 100%;
  padding: 8px 16px;
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  margin-bottom: 8px;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-secondary {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #f3f4f6;
}

.section-title {
  margin: 24px 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.setting-subgroup {
  margin-left: 16px;
  margin-bottom: 16px;
  padding-left: 12px;
  border-left: 2px solid #e5e7eb;
}

.setting-subgroup label {
  font-size: 13px;
  color: #6b7280;
}
</style>
