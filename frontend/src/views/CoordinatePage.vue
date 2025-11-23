<template>
  <div class="coordinate-page">
    <!-- 顶部容器：包含3D视图和配置面板 -->
    <div class="top-container" :style="{ height: topHeight + 'px' }">
      <!-- 左侧面板：视觉样式配置 -->
      <div class="left-panel">
        <h3>Visual Style</h3>
        <div class="config-section">
          <h4>Visual Mapping</h4>
          <div class="form-group">
            <label>Color By:</label>
            <select v-model="config.colorBy">
              <option value="">None</option>
              <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Shape By:</label>
            <select v-model="config.shapeBy">
              <option value="">None</option>
              <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
        </div>

        <div class="config-section">
          <h4>2D View Plane</h4>
          <div class="radio-group">
             <label><input type="radio" v-model="config.planeMode" value="XY"> XY</label>
             <label><input type="radio" v-model="config.planeMode" value="XZ"> XZ</label>
             <label><input type="radio" v-model="config.planeMode" value="YZ"> YZ</label>
          </div>
        </div>
      </div>

      <!-- 中间面板：3D视图 -->
      <div class="center-panel">
        <Coordinate3D 
          :data="data" 
          :config="config"
          @node-hover="onNodeHover"
        />
      </div>

      <!-- 右侧面板：数据映射和节点信息 -->
      <div class="right-panel">
        <h3>Data Mapping</h3>
        <div class="config-section">
          <h4>Axis Mapping</h4>
          <div class="form-group">
            <label>X Axis:</label>
            <select v-model="config.xAxis">
              <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Y Axis:</label>
            <select v-model="config.yAxis">
              <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Z Axis (3D):</label>
            <select v-model="config.zAxis">
              <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
        </div>
        
        <div class="config-section">
            <h4>Node Info</h4>
            <div v-if="hoveredNode" class="node-info">
            <div v-for="(value, key) in hoveredNode" :key="key" class="info-item">
                <strong>{{ key }}:</strong> {{ value }}
            </div>
            </div>
            <div v-else class="no-selection">
            Hover over a node to see details
            </div>
        </div>
      </div>
    </div>

    <!-- 可拖动的分隔条 -->
    <div 
      class="resizer" 
      @mousedown="startResize"
    >
      <div class="resizer-handle"></div>
    </div>

    <!-- 底部容器：2D坐标视图/时间轴视图 -->
    <div class="bottom-container" :style="{ height: `calc(100% - ${topHeight}px - 6px)` }">
      <Coordinate2D 
        :data="data" 
        :config="config"
        @node-hover="onNodeHover"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import * as d3 from 'd3';
import Coordinate3D from '../components/coordinate/Coordinate3D.vue';
import Coordinate2D from '../components/coordinate/Coordinate2D.vue';

// 数据点类型定义
interface DataPoint {
  [key: string]: any;
}

// 配置类型定义
interface Config {
  xAxis: string;
  yAxis: string;
  zAxis: string;
  colorBy: string;
  shapeBy: string;
  planeMode: 'XY' | 'XZ' | 'YZ';
}

// 状态管理
const data = ref<DataPoint[]>([]); // 存储加载的数据
const columns = ref<string[]>([]); // 存储数据的列名
const hoveredNode = ref<DataPoint | null>(null); // 存储当前悬停的节点

// 配置对象，使用reactive使其具有响应性
const config = reactive<Config>({
  xAxis: '',
  yAxis: '',
  zAxis: '',
  colorBy: '',
  shapeBy: '',
  planeMode: 'XY'
});

/**
 * 加载数据函数
 * 从/people.csv文件加载数据并进行初步处理
 */
const loadData = async () => {
  try {
    const response = await fetch('/People.csv');
    const text = await response.text();
    const parsedData = d3.csvParse(text);
    
    if (parsedData.length > 0) {
      data.value = parsedData;
      columns.value = parsedData.columns;
      
      // 设置默认映射：优先选择数值型列作为坐标轴
      const numericCols = columns.value.filter(col => {
        const row = parsedData[0];
        if (!row) return false;
        const val = parseFloat(row[col] || '');
        return !isNaN(val);
      });
      
      if (numericCols.length >= 2) {
        config.xAxis = numericCols[0] || '';
        config.yAxis = numericCols[1] || '';
        if (numericCols.length >= 3) config.zAxis = numericCols[2] || '';
      }
      
      // 设置默认的分类映射：选择非数值型列作为颜色和形状映射
      const catCols = columns.value.filter(col => !numericCols.includes(col));
      if (catCols.length > 0) {
        config.colorBy = catCols[0] || '';
        if (catCols.length > 1) config.shapeBy = catCols[1] || '';
      }
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
};

/**
 * 节点悬停事件处理函数
 * @param node - 悬停的节点数据，如果未悬停则为null
 */
const onNodeHover = (node: DataPoint | null) => {
  hoveredNode.value = node;
};

// 可调整高度的逻辑
const topHeight = ref(window.innerHeight * 0.5); // 默认50%高度
let isResizing = false;
let startY = 0;
let startHeight = 0;

/**
 * 开始调整大小事件处理函数
 * @param e - 鼠标事件
 */
const startResize = (e: MouseEvent) => {
  isResizing = true;
  startY = e.clientY;
  startHeight = topHeight.value;
  e.preventDefault();
  
  // 添加鼠标移动和松开事件监听器
  const onMouseMove = (moveEvent: MouseEvent) => {
    if (!isResizing) return;
    
    // 计算鼠标移动的距离
    const deltaY = moveEvent.clientY - startY;
    const newHeight = startHeight + deltaY;
    
    // 限制最小和最大高度（20% - 80%）
    const minHeight = window.innerHeight * 0.2;
    const maxHeight = window.innerHeight * 0.8;
    
    if (newHeight >= minHeight && newHeight <= maxHeight) {
      topHeight.value = newHeight;
    }
  };
  
  const onMouseUp = () => {
    isResizing = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};

// 生命周期钩子
onMounted(() => {
  loadData();
});

</script>

<style scoped>
/* 页面容器样式 */
.coordinate-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

/* 顶部容器样式 */
.top-container {
  flex: 1;
  display: flex;
  border-bottom: 1px solid #eee;
  background: #fff;
  position: relative;
  overflow: hidden;
}

/* 左右侧面板样式 */
.left-panel, .right-panel {
  width: 250px;
  background: #fff;
  padding: 20px;
  overflow-y: auto;
  z-index: 10;
}

.left-panel {
  border-right: 1px solid #eee;
}

.right-panel {
  border-left: 1px solid #eee;
}

/* 中间面板（3D视图）样式 */
.center-panel {
  flex: 1;
  background: #f0f2f5;
  position: relative;
  overflow: hidden;
}

/* 调整大小分隔条样式 */
.resizer {
  height: 6px;
  background: #f0f0f0;
  cursor: ns-resize;
  position: relative;
  z-index: 10;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resizer:hover {
  background: #e0e0e0;
}

.resizer-handle {
  width: 60px;
  height: 3px;
  background: #999;
  border-radius: 2px;
}

.resizer:hover .resizer-handle {
  background: #666;
}

/* 底部容器（2D视图）样式 */
.bottom-container {
  background: #fff;
  position: relative;
  overflow: hidden;
}

/* 配置区域样式 */
.config-section {
  margin-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.config-section h4 {
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: #333;
}

.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
}

/* 节点信息样式 */
.node-info {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
}

.info-item {
  margin-bottom: 4px;
  word-break: break-word;
}

.no-selection {
  color: #999;
  font-style: italic;
  font-size: 13px;
}

/* 平面模式选择样式 */
.radio-group {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  cursor: pointer;
}

/* 标题样式 */
h3 {
  font-size: 16px;
  margin-bottom: 16px;
  color: #333;
}
</style>