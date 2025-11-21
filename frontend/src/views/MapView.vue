<!-- components/MapView.vue -->
<template>

  <!-- 容器：只保留语义类名 -->
  <div class="map-container">

     <!-- 地图挂载点 -->
    <div ref="mapContainer" class="map-element"></div>

    <!-- 标注表单 -->
    <AnnotationForm 
      :is-open="isAnnotationFormOpen"
      :initial-data="editingAnnotation"
      :location="tempAnnotationLoc"
      @cancel="isAnnotationFormOpen = false; editingAnnotation = undefined"
      @submit="handleAnnotationSubmit"
    />

    <!-- 地图控件区域 -->
    <div class="map-controls-wrapper">
      <div class="controls-group">
        
        <!-- 1. 图层切换器 -->
        <div class="control-item layer-switcher" @mouseenter="showLayerPanel = true" @mouseleave="showLayerPanel = false">
           <button class="control-btn" title="切换底图">
             <Layers :size="18" />
           </button>
           
           <!-- 图层面板 -->
           <transition name="fade-slide">
             <div v-if="showLayerPanel" class="panel layer-panel">
                <div class="panel-header">
                   <h4>地图风格 (Base Map)</h4>
                   <span>预览</span>
                </div>
                <div class="layer-grid">
                   <div 
                     v-for="style in MAP_STYLES"
                     :key="style.id"
                     @click="mapStore.activeLayer = style.id"
                     class="layer-card"
                     :class="{ active: activeLayer === style.id }"
                   >
                      <div class="preview-box" :style="{ backgroundColor: style.previewColor }">
                        <div class="preview-overlay" :style="{ filter: style.filter }"></div>
                        <div v-if="activeLayer === style.id" class="check-mark">
                           <div class="check-circle">
                             <Check :size="12" color="white" />
                           </div>
                        </div>
                      </div>
                      <div class="layer-name">
                        {{ style.name.split(' ')[0] }}
                      </div>
                   </div>
                </div>
             </div>
           </transition>
        </div>

        <!-- 2. 语言切换器 -->
        <div class="control-item language-switcher">
           <button class="control-btn" @click="showLangMenu = !showLangMenu" title="Translation / 翻译">
             <Languages :size="18" />
           </button>
           
           <div v-if="showLangMenu" class="menu language-menu">
              <div class="menu-header">选择显示语言</div>
              <button
                v-for="lang in LANGUAGES"
                :key="lang.code"
                @click="mapStore.targetLanguage = lang.code; showLangMenu = false"
                class="menu-item"
                :class="{ active: targetLanguage === lang.code }"
              >
                {{ lang.label }}
                <Check v-if="targetLanguage === lang.code" :size="14" />
              </button>
           </div>
        </div>

        <!-- 3. 地名标签开关 -->
        <button 
             @click="showLabels = !showLabels"
             class="control-btn"
             :class="{ 'btn-disabled': !showLabels }"
             :title="showLabels ? '隐藏地名' : '显示地名'"
           >
             <Type :size="18" />
             <div v-if="!showLabels" class="strike-through" />
        </button>

      </div>
    </div>

  </div>
</template>



<script setup lang="ts">
import { onMounted, ref, shallowRef, watch, onUnmounted, h, render } from 'vue';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMapStore } from '@/stores/mapStore';
import { storeToRefs } from "pinia";
import { Languages, Check, Layers, Type } from "lucide-vue-next";
import PopupCard from '@/components/map/PopupCard.vue';
import AnnotationForm from '@/components/map/AnnotationForm.vue';
import type { DataRecord, Annotation, SearchResult } from '../types/index.ts';

// --- Constants ---
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

import { parseCSV } from '@/services/fileUploadService';

const LANGUAGES = [
  { code: 'zh-CN', label: '中文 (简体)' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'fr', label: 'Français' },
];

// --- Store ---
const mapStore = useMapStore();
const { 
  filteredData, rawData, selectedRecordId, isSidebarOpen, 
  targetLanguage, activeLayer, annotations, searchResult,
  isAnnotationMode, groupByColumn, categoryColors, relationColumn 
} = storeToRefs(mapStore);

// --- Local State ---
const mapContainer = ref<HTMLElement | null>(null);
// 使用 shallowRef 避免 Vue 深度代理 Leaflet 实例，提升性能
const map = shallowRef<L.Map | null>(null);
const tileLayerRef = shallowRef<L.TileLayer | null>(null);
const dataLayerRef = shallowRef<L.FeatureGroup | null>(null);
const relationLayerRef = shallowRef<L.FeatureGroup | null>(null);
const annotationLayerRef = shallowRef<L.FeatureGroup | null>(null);
const searchLayerRef = shallowRef<L.FeatureGroup | null>(null);

const showLangMenu = ref(false);
const showLayerPanel = ref(false);
const showLabels = ref(true);

// Annotation Form State
const isAnnotationFormOpen = ref(false);
const tempAnnotationLoc = ref<{lat: number, lng: number} | undefined>(undefined);
const editingAnnotation = ref<Annotation | undefined>(undefined);

// --- Helper: Render Vue Component to Leaflet Popup ---
const bindVuePopup = (layer: L.Layer, component: any, props: any) => {
  const container = document.createElement('div');
  
  // 创建 Popup
  const popup = L.popup({
    minWidth: 280,
    maxWidth: 320,
    closeButton: false,
    className: 'custom-popup'
  }).setContent(container);

  layer.bindPopup(popup);

  // 当 Popup 打开时挂载 Vue 组件
  layer.on('popupopen', () => {
    // h 函数创建虚拟节点，render 函数将其挂载到 DOM
    render(h(component, props), container);
  });

  // 当 Popup 关闭时卸载组件，避免内存泄漏
  layer.on('popupclose', () => {
    render(null, container);
  });
  
  return popup;
};

// --- 可视化与逻辑 ---

//1. 根据模式更新光标
watch(isAnnotationMode, (mode) => {
  if (mapContainer.value) {
    mapContainer.value.style.cursor = mode ? 'crosshair' : 'grab';
  }
});

// 2。更新瓦片图层
const updateTileLayer = () => {
  if (!map.value) return;
  
  // 1. 【关键修复】先用局部变量保存“旧图层”
  // 这样即使 tileLayerRef.value 稍后变了，oldLayer 依然指向要被删除的那个
  const oldLayer = tileLayerRef.value;
  
  // 获取当前样式配置
  const currentStyle = MAP_STYLES.find(s => s.id === activeLayer.value) || MAP_STYLES[0];
  
  // 2. 构建 URL
  // s.e:l|p.v:off 代表 style.element:labels | property.visibility:off
  const apistyle = !showLabels.value ? '&apistyle=s.e:l|p.v:off' : '';
  
  // 确保 targetLanguage.value 存在，默认为 zh-CN
  const lang = targetLanguage.value || 'zh-CN';
  
  const url = `https://mt1.google.com/vt/lyrs=${currentStyle.type}&x={x}&y={y}&z={z}&hl=${lang}${apistyle}`;

  // 3. 创建新图层
  const newLayer = L.tileLayer(url, {
    maxZoom: 20,
    attribution: '&copy; Google Maps',
    zIndex: 0 // 确保底图层级最低
  });

  // 4. 添加新图层并放置到底部
  newLayer.addTo(map.value);
  newLayer.bringToBack(); // 物理层级置底

  // 5. 重新调整覆盖物的层级（防止底图盖住数据点）
  // 这一点很重要，否则切换底图瞬间数据可能会被遮挡
  if (relationLayerRef.value) relationLayerRef.value.bringToFront();
  if (dataLayerRef.value) dataLayerRef.value.bringToFront();
  if (searchLayerRef.value) searchLayerRef.value.bringToFront();
  if (annotationLayerRef.value) annotationLayerRef.value.bringToFront();

  // 6. 【关键修复】延迟移除“旧图层”（oldLayer），而不是 tileLayerRef.value
  if (oldLayer) {
    setTimeout(() => {
      if (map.value && map.value.hasLayer(oldLayer)) {
        map.value.removeLayer(oldLayer);
      }
    }, 300); // 300ms 足够平滑过渡了
  }

  // 7. 更新 Ref 指向新图层
  tileLayerRef.value = newLayer;
  
  // 处理滤镜效果 (CSS Filter)
  const newContainer = newLayer.getContainer();
  if (newContainer) {
    if (currentStyle.filter) {
        newContainer.style.filter = currentStyle.filter;
    }
    // 简单的淡入动画
    newContainer.style.opacity = '0';
    newContainer.style.transition = 'opacity 0.3s ease-in-out';
    requestAnimationFrame(() => {
        newContainer.style.opacity = '1';
    });
  }
};

watch([activeLayer, targetLanguage, showLabels], updateTileLayer);

// 3. 处理数据点和关系
watch([filteredData, groupByColumn, categoryColors, relationColumn], () => {
  if (!map.value || !dataLayerRef.value || !relationLayerRef.value) return;

  dataLayerRef.value.clearLayers();
  relationLayerRef.value.clearLayers();

  // Draw Lines
  if (relationColumn.value) {
    filteredData.value.forEach(record => {
      const targetId = record[relationColumn.value!];
      if (targetId) {
        const target = rawData.value.find(r => String(r.id) === String(targetId) || String(r.label) === String(targetId));
        if (target) {
          L.polyline([[record.lat, record.lng], [target.lat, target.lng]], {
            color: '#999',
            weight: 1,
            opacity: 0.6,
            dashArray: '5, 5'
          }).addTo(relationLayerRef.value!);
        }
      }
    });
  }

  // Draw Markers
  filteredData.value.forEach(record => {
    let color = '#0077b6';
    if (groupByColumn.value && categoryColors.value) {
        const val = String(record[groupByColumn.value] || 'Unknown');
        color = categoryColors.value[val] || '#999';
    }

    const marker = L.circleMarker([record.lat, record.lng], {
      radius: 6,
      fillColor: color,
      color: '#fff',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.85
    });

    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      mapStore.selectedRecordId = record.id;
    });

    marker.addTo(dataLayerRef.value!);
  });
}, { deep: true });

// 4. 处理注释
watch(annotations, (newAnnos) => {
  if (!map.value || !annotationLayerRef.value) return;
  annotationLayerRef.value.clearLayers();

  newAnnos.forEach(anno => {
    const iconHtml = `
        <div style="position: relative;">
           <div style="
              background-color: ${anno.category === 'default' ? '#e63946' : '#2a9d8f'}; 
              width: 14px; height: 14px; 
              border-radius: 50%; 
              border: 2px solid white; 
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
           "></div>
           <div style="
              position: absolute; top: -20px; left: 50%; transform: translateX(-50%);
              background: white; padding: 1px 4px; border-radius: 3px;
              font-size: 10px; white-space: nowrap; font-weight: bold;
              box-shadow: 0 1px 2px rgba(0,0,0,0.1);
              opacity: 0.9;
              display: block;
           ">
              ${anno.label}
           </div>
        </div>
      `;

    const icon = L.divIcon({
      className: 'custom-anno-icon',
      html: iconHtml,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    const marker = L.marker([anno.lat, anno.lng], { icon });
    
    // Bind Vue Component to Popup
    bindVuePopup(marker, PopupCard, {
        data: anno,
        type: "annotation",
        onClose: () => marker.closePopup(),
        onEdit: () => {
            marker.closePopup();
            tempAnnotationLoc.value = { lat: anno.lat, lng: anno.lng };
            editingAnnotation.value = anno;
            isAnnotationFormOpen.value = true;
        },
        onDelete: () => {
            if(window.confirm(`删除 "${anno.label}"?`)) {
                marker.closePopup();
                mapStore.removeAnnotation(anno.id);
            }
        }
    });

    marker.addTo(annotationLayerRef.value!);
  });
}, { deep: true, immediate: true });

// 5. 处理搜索结果
watch(searchResult, (result) => {
  if (!map.value || !searchLayerRef.value) return;
  searchLayerRef.value.clearLayers();

  if (result) {
    const searchIcon = L.divIcon({
        className: 'search-marker-icon',
        html: `<div style="
          background-color: #FFB703; 
          width: 24px; height: 24px; 
          border-radius: 50% 50% 0 50%; 
          border: 2px solid white; 
          transform: rotate(45deg);
          box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
        ">
          <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24], 
        popupAnchor: [0, -24]
    });

    const marker = L.marker([result.lat, result.lng], { icon: searchIcon });
    
    const popup = bindVuePopup(marker, PopupCard, {
        data: result,
        type: "search",
        onClose: () => marker.closePopup()
    });

    marker.addTo(searchLayerRef.value!);
    marker.openPopup();
  }
});

// 6. 处理选择弹出窗口（编程方式打开）
watch([selectedRecordId, targetLanguage], ([id, lang]) => {
  if (!map.value) return;
  
  if (id) {
    map.value.closePopup(); // close existing
    const record = filteredData.value.find(r => r.id === id);
    
    if (record) {
      const container = document.createElement('div');
      const popup = L.popup({ 
          minWidth: 280, 
          maxWidth: 320, 
          closeButton: false,
          offset: [0, -10],
          className: 'custom-popup'
      })
      .setLatLng([record.lat, record.lng])
      .setContent(container)
      .openOn(map.value);

      // Mount Vue Component
      render(h(PopupCard, {
        data: record,
        type: "record",
        targetLanguage: lang,
        onClose: () => mapStore.selectedRecordId = null
      }), container);
      
      // Cleanup on close
      popup.on('remove', () => {
        render(null, container);
      });
    }
  }
});

// 7. Resize invalidation
watch(isSidebarOpen, () => {
  setTimeout(() => map.value?.invalidateSize(), 300);
});

// --- 操作 ---
const handleAnnotationSubmit = (data: { label: string; note: string; category: string }) => {
    if (editingAnnotation.value) {
        mapStore.updateAnnotation(editingAnnotation.value.id, data);
    } else if (tempAnnotationLoc.value) {
        mapStore.addAnnotation({
            id: `anno-${Date.now()}`,
            lat: tempAnnotationLoc.value.lat,
            lng: tempAnnotationLoc.value.lng,
            label: data.label,
            note: data.note,
            category: data.category
        });
    }
    isAnnotationFormOpen.value = false;
    editingAnnotation.value = undefined;
};

// 地图初始化
onMounted(async () => {
  if (!mapContainer.value) return;

  // 初始化地图
  map.value = L.map(mapContainer.value, {
    center: [34.0, 108.0],
    zoom: 4,
    zoomControl: false // 使用自定义控件
  });

  // 初始化图层组
  dataLayerRef.value = L.featureGroup().addTo(map.value);
  relationLayerRef.value = L.featureGroup().addTo(map.value);
  annotationLayerRef.value = L.featureGroup().addTo(map.value);
  searchLayerRef.value = L.featureGroup().addTo(map.value);

  // 初始化瓦片图层
  updateTileLayer();

  // 添加地图事件监听器
  map.value.on('moveend', () => {
    if (map.value) {
      const center = map.value.getCenter();
      const zoom = map.value.getZoom();
      mapStore.setCurrentView({
        center: [center.lat, center.lng],
        zoom
      });
    }
  });

  // 双击添加注解
  map.value.on('dblclick', (e: L.LeafletMouseEvent) => {
    if (isAnnotationMode.value) {
      tempAnnotationLoc.value = { lat: e.latlng.lat, lng: e.latlng.lng };
      editingAnnotation.value = undefined;
      isAnnotationFormOpen.value = true;
    }
  });

  // 加载测试数据
  try {
    const response = await fetch('/datas.csv');
    const csvContent = await response.text();
    const parsedData = parseCSV(csvContent);
    mapStore.setRawData(parsedData);
  } catch (error) {
    console.error('加载测试数据失败:', error);
  }
});

// 地图销毁
onUnmounted(() => {
  if (map.value) {
    map.value.remove();
  }
});
</script>


<style scoped>
/* --- 基础布局 --- */
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
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

/* --- 通用按钮样式 --- */
.control-btn {
  background-color: white;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #d1d5db;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
  position: relative;
}

.control-btn:hover {
  background-color: #f9fafb;
}

.control-btn.btn-disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
}

.strike-through {
  position: absolute;
  width: 20px;
  height: 2px;
  background-color: #9ca3af;
  transform: rotate(45deg);
  border-radius: 999px;
}

/* --- 面板与菜单通用 --- */
.panel, .menu {
  position: absolute;
  right: 40px;
  top: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

/* --- 图层面板样式 --- */
.layer-panel {
  width: 320px;
  padding: 12px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.panel-header h4 {
  font-size: 12px;
  font-weight: bold;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.panel-header span {
  font-size: 10px;
  color: #9ca3af;
}

.layer-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.layer-card {
  cursor: pointer;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid #f3f4f6;
  transition: all 0.2s;
  position: relative;
}

.layer-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

/* 选中状态 */
.layer-card.active {
  border-color: var(--primary-color); /* palladio-blue */
  box-shadow: 0 0 0 1px var(--primary-color);
}

.preview-box {
  height: 56px;
  width: 100%;
  background-color: #e5e5e5;
  position: relative;
}

.preview-overlay {
  position: absolute;
  inset: 0;
  opacity: 0.3;
  background-image: linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc);
  background-size: 20px 20px;
}

.check-mark {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(1px);
}

.check-circle {
  background-color: var(--primary-color);
  border-radius: 999px;
  padding: 2px;
}

.layer-name {
  font-size: 10px;
  text-align: center;
  padding: 6px 0;
  font-weight: 500;
  color: #374151;
  background-color: white;
  border-top: 1px solid #f9fafb;
}

/* --- 语言菜单样式 --- */
.language-menu {
  width: 160px;
}

.menu-header {
  padding: 8px 12px;
  background-color: #f9fafb;
  border-bottom: 1px solid #f3f4f6;
  font-size: 12px;
  font-weight: bold;
  color: #6b7280;
}

.menu-item {
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.2s;
  color: #374151;
}

.menu-item:hover {
  background-color: #f9fafb;
}

.menu-item.active {
  background-color: #eff6ff;
  color: var(--primary-color);
  font-weight: 500;
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
</style>
