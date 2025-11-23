<!--
  GraphLegend.vue - 图谱图例组件

  功能：
  1. 显示节点类型与颜色的对应关系
  2. 自动根据内容调整布局
  3. 支持多列显示以适应大量类型

  主要特性：
  - 圆点样式与节点保持一致
  - 自动换行，无滚动条
  - 透明毛玻璃效果
  - 响应式布局
-->
<template>
  <div class="graph-legend">
    <div class="legend-items">
      <div v-for="type in types" :key="type" class="legend-item">
        <span class="legend-dot" :style="{ backgroundColor: colorScale(type) }"></span>
        <span class="legend-label">{{ type || 'Unknown' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as d3 from 'd3';

// ------------------- Props -------------------
const props = defineProps<{
  types: string[];  // 节点类型列表
}>();

// ------------------- 颜色比例尺 -------------------
// 使用与GraphCanvas相同的颜色方案
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
</script>

<style scoped>
/* 图例容器 */
.graph-legend {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  z-index: 10;
  pointer-events: auto;
  max-width: 400px;
}

/* 图例项容器 - 使用flex wrap实现多列布局 */
.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

/* 单个图例项 */
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #333;
  white-space: nowrap;
}

/* 圆点样式 - 与节点保持一致 */
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(0,0,0,0.15);
}

/* 标签文本 */
.legend-label {
  font-weight: 500;
}
</style>
