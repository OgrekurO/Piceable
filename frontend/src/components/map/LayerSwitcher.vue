<template>
  <div class="layer-switcher">
    <button 
      class="switcher-btn" 
      @click="showPanel = !showPanel"
      :title="'切换底图'"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"></rect>
        <rect x="14" y="3" width="7" height="7" rx="1"></rect>
        <rect x="3" y="14" width="7" height="7" rx="1"></rect>
        <rect x="14" y="14" width="7" height="7" rx="1"></rect>
      </svg>
    </button>

    <div v-if="showPanel" class="layer-panel" @mouseleave="showPanel = false">
      <div class="panel-header">
        <h4>地图风格 (Base Map)</h4>
        <span>预览</span>
      </div>
      
      <div class="layer-grid">
        <div 
          v-for="style in MAP_STYLES" 
          :key="style.id"
          @click="handleLayerSelect(style.id)"
          class="layer-item"
          :class="{ 'active': activeLayer === style.id }"
        >
          <div 
            class="layer-preview" 
            :style="{ backgroundColor: style.previewColor }"
          >
            <div 
              class="layer-filter" 
              :style="{ filter: style.filter }"
            ></div>
            
            <div v-if="activeLayer === style.id" class="layer-check">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          
          <div class="layer-name">{{ style.name.split(' ')[0] }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMapStore } from '@/stores/mapStore';

// 地图样式配置
const MAP_STYLES = [
  {
    id: 'streets',
    name: '标准 (Streets)',
    type: 'm',
    filter: '',
    previewColor: '#f8f9fa',
  },
  {
    id: 'satellite',
    name: '卫星 (Satellite)',
    type: 'y',
    filter: '',
    previewColor: '#0f172a',
  },
  {
    id: 'terrain',
    name: '地形 (Terrain)',
    type: 'p',
    filter: '',
    previewColor: '#ecfccb',
  },
  {
    id: 'light',
    name: '淡色 (Light)',
    type: 'm',
    filter: 'grayscale(100%) contrast(90%) brightness(105%)',
    previewColor: '#ffffff',
  },
  {
    id: 'dark',
    name: '深色 (Dark)',
    type: 'm',
    filter: 'invert(100%) hue-rotate(180deg) brightness(90%) contrast(90%) grayscale(20%)',
    previewColor: '#171717',
  }
];

const showPanel = ref(false);
const mapStore = useMapStore();

// 计算当前激活的图层
const activeLayer = computed(() => mapStore.activeLayer);

// 处理图层选择
const handleLayerSelect = (layerId: string) => {
  mapStore.setActiveLayer(layerId);
  showPanel.value = false;
};
</script>

<style scoped>
.layer-switcher {
  position: relative;
}

.switcher-btn {
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
}

.switcher-btn:hover {
  background: #f5f7fa;
  border-color: #c6c8cc;
}

.layer-panel {
  position: absolute;
  right: 40px;
  top: 0;
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  width: 320px;
  z-index: 1000;
  animation: fadeIn 0.2s ease-in-out;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.panel-header h4 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.panel-header span {
  font-size: 10px;
  color: #999;
}

.layer-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.layer-item {
  cursor: pointer;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid #f1f1f1;
  transition: all 0.2s;
}

.layer-item:hover {
  border-color: #ddd;
}

.layer-item.active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.layer-preview {
  height: 56px;
  width: 100%;
  background: #e5e5e5;
  position: relative;
  overflow: hidden;
}

.layer-filter {
  position: absolute;
  inset: 0;
  opacity: 30%;
  background: linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
}

.layer-check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(1px);
}

.layer-name {
  text-align: center;
  padding: 6px 0;
  font-size: 10px;
  font-weight: 500;
  color: #333;
  background: white;
  border-top: 1px solid #eee;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>