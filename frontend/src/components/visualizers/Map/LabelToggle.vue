<template>
  <button 
    class="label-toggle" 
    :class="{ 'active': showLabels }"
    @click="handleToggle"
    :title="showLabels ? '隐藏地名 (Hide Labels)' : '显示地名 (Show Labels)'"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="4 7 4 4 20 4 20 7"></polyline>
      <line x1="9" y1="20" x2="15" y2="20"></line>
      <line x1="12" y1="4" x2="12" y2="20"></line>
    </svg>
    <div v-if="!showLabels" class="cross-line"></div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMapStore } from '@/stores/mapStore';

const mapStore = useMapStore();

// 计算标签显示状态
const showLabels = computed(() => mapStore.showLabels);

// 处理切换
const handleToggle = () => {
  mapStore.setShowLabels(!mapStore.showLabels);
};
</script>

<style scoped>
.label-toggle {
  background: white;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.label-toggle:hover {
  background: #f5f7fa;
  border-color: #c6c8cc;
}

.label-toggle.active {
  background: white;
  color: #333;
}

.label-toggle:not(.active) {
  background: #f1f1f1;
  color: #999;
}

.cross-line {
  position: absolute;
  width: 20px;
  height: 1.5px;
  background: #999;
  border-radius: 2px;
  transform: rotate(45deg);
}
</style>