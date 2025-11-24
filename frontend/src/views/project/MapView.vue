<!-- components/MapView.vue -->
<template>
  <div class="map-layout">
    
    <!-- 侧边栏容器 -->
    <div class="sidebar-container" :class="{ 'sidebar-open': isSidebarOpen }">
      <MapSidebar />
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      
      <!-- 展开侧边栏按钮 -->
      <button 
        v-if="!isSidebarOpen"
        @click="mapViewStore.setIsSidebarOpen(true)"
        class="sidebar-toggle-btn"
        title="展开侧边栏"
      >
        <PanelLeftOpen :size="20" />
      </button>

      <!-- 地图挂载点 -->
      <div ref="mapContainer" class="map-element"></div>

      <!-- 标注表单 -->
      <AnnotationForm 
        :is-open="isAnnotationFormOpen"
        :initial-data="editingEntity"
        :location="tempAnnotationLoc"
        @cancel="isAnnotationFormOpen = false; editingEntity = undefined"
        @submit="handleAnnotationSubmit"
      />

      <!-- 地图控件区域 -->
      <div class="map-controls-wrapper">
        <div class="controls-group">
          
          <!-- 1. 图层切换器 -->
          <LayerSwitcher />

          <!-- 2. 语言切换器 -->
          <LanguageSwitcher />

          <!-- 3. 地名标签开关 -->
          <LabelToggle />
        
          <!-- Road Toggle -->
          <button 
            v-if="supportsRoads"
            class="label-toggle" 
            :class="{ active: showRoads }"
            @click="mapViewStore.setShowRoads(!showRoads)"
            title="显示/隐藏道路"
          >
            <component :is="showRoads ? Route : RouteOff" :size="18" />
          </button>

        </div>
      </div>
  
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useProjectStore } from '@/stores/projectStore';
import { useMapViewStore } from '@/stores/mapViewStore';
import { storeToRefs } from "pinia";
import { PanelLeftOpen, Route, RouteOff } from 'lucide-vue-next';
import AnnotationForm from '@/components/visualizers/Map/AnnotationForm.vue';
import LayerSwitcher from '@/components/visualizers/Map/LayerSwitcher.vue';
import LanguageSwitcher from '@/components/visualizers/Map/LanguageSwitcher.vue';
import LabelToggle from '@/components/visualizers/Map/LabelToggle.vue';
import MapSidebar from '@/components/visualizers/Map/mapSidebar.vue';

// Composables
import { useMapCore } from '@/composables/map/useMapCore';
import { useMapTileLayer } from '@/composables/map/useMapTileLayer';
import { useMapDataVisualization } from '@/composables/map/useMapDataVisualization';
import { useMapPopup } from '@/composables/map/useMapPopup';
import { useMapAnnotation } from '@/composables/map/useMapAnnotation';
import { useMapTestData } from '@/composables/map/useMapTestData';
import { useMapProviders } from '@/composables/map/useMapProviders';

// --- Stores ---
const projectStore = useProjectStore();
const mapViewStore = useMapViewStore();

const { 
  filteredEntities, entities, selectedEntityId, 
  targetLanguage, searchResult,
  groupByColumn, categoryColors
} = storeToRefs(projectStore);

const {
  isSidebarOpen, activeLayer, showLabels, showRoads
} = storeToRefs(mapViewStore);

// --- Map Container ---
const mapContainer = ref<HTMLElement | null>(null);

// --- Map Core ---
const { 
  map, 
  dataLayerRef, 
  relationLayerRef, 
  searchLayerRef, 
  initializeMap 
} = useMapCore(mapViewStore);

// --- Tile Layer ---
const { updateTileLayer } = useMapTileLayer(
  map, 
  activeLayer, 
  targetLanguage, 
  showLabels, 
  showRoads,
  dataLayerRef,
  relationLayerRef,
  searchLayerRef
);

// --- Data Visualization ---
useMapDataVisualization(
  map,
  dataLayerRef,
  relationLayerRef,
  filteredEntities,
  entities,
  groupByColumn,
  categoryColors,
  projectStore
);

// --- Popup ---
useMapPopup(
  map,
  searchLayerRef,
  filteredEntities,
  selectedEntityId,
  searchResult,
  targetLanguage,
  projectStore
);

// --- Annotation ---
const { 
  isAnnotationFormOpen, 
  tempAnnotationLoc, 
  editingEntity, 
  openAnnotationForm,
  handleAnnotationSubmit 
} = useMapAnnotation(projectStore);

// --- Test Data ---
const { loadTestData } = useMapTestData(projectStore);

// --- Map Providers (特性检测) ---
// activeLayer 已经从 storeToRefs 获取,直接使用
const { supportsRoads } = useMapProviders(activeLayer);

// --- Lifecycle ---
onMounted(async () => {
  if (!mapContainer.value) return;

  // 初始化地图
  initializeMap(mapContainer.value);
  
  // 初始化瓦片图层
  updateTileLayer();
  
  // 双击添加标注
  map.value?.on('dblclick', (e: any) => {
    openAnnotationForm({ lat: e.latlng.lat, lng: e.latlng.lng });
  });

  // 加载测试数据
  await loadTestData();
});

// 监听侧边栏状态,调整地图大小
watch(isSidebarOpen, () => {
  setTimeout(() => map.value?.invalidateSize(), 300);
});
</script>


<style scoped>
/* --- 基础布局 --- */
.map-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

/* --- 侧边栏 --- */
.sidebar-container {
  width: 0;
  height: 100%;
  background-color: white;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.1);
  z-index: 500;
  transition: all 0.3s ease-in-out;
  overflow: hidden;
  opacity: 0;
  transform: translateX(-100%);
  flex-shrink: 0;
}

.sidebar-container.sidebar-open {
  width: 320px; /* w-80 */
  opacity: 1;
  transform: translateX(0);
}

/* --- 主内容区域 --- */
.main-content {
  flex: 1;
  position: relative;
  height: 100%;
  width: 100%;
}

/* --- 侧边栏展开按钮 --- */
.sidebar-toggle-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 400;
  background-color: white;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  color: #4b5563; /* text-gray-600 */
  transition: background-color 0.2s, color 0.2s;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-toggle-btn:hover {
  background-color: #f9fafb; /* bg-gray-50 */
  color: #1f2937; /* text-gray-800 */
}

.map-element {
  width: 100%;
  height: 100%;
  z-index: 0;
  background-color: var(--color-background);
}

/* --- 控件区域容器 --- */
.map-controls-wrapper {
  position: absolute;
  top: 16px;    /* top-4 */
  right: 16px;  /* right-4 */
  z-index: 400;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  pointer-events: none; /* 让点击穿透空白区域 */
}

.controls-group {
  pointer-events: auto; /* 恢复按钮的可点击性 */
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

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

/* --- 注释点样式 --- */

:deep(.leaflet-interactive) {
  cursor: pointer;
}

/* 鼠标悬停时放大并改变颜色 */
:deep(.leaflet-interactive:hover) {
  stroke: rgb(238, 238, 238);
  stroke-width: 1px;
  filter: drop-shadow(0 0 4px rgba(0,0,0,0.5));
}

/* --- Vue Transition 动画 --- */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

/* --- Custom Annotation Marker --- */
:deep(.custom-annotation-marker) {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

:deep(.marker-pin) {
  width: 30px;
  height: 30px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  transition: transform 0.2s;
}

:deep(.marker-pin:hover) {
  transform: rotate(-45deg) scale(1.1);
}

:deep(.marker-emoji) {
  transform: rotate(45deg); /* Counter-rotate emoji */
  font-size: 14px;
  line-height: 1;
}

:deep(.marker-label) {
  position: absolute;
  top: -24px;
  background-color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  pointer-events: none;
  opacity: 0.9;
}
</style>
