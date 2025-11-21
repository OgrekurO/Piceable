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
        @click="mapStore.setIsSidebarOpen(true)"
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
        :initial-data="editingAnnotation"
        :location="tempAnnotationLoc"
        @cancel="isAnnotationFormOpen = false; editingAnnotation = undefined"
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
            class="label-toggle" 
            :class="{ active: showRoads }"
            @click="mapStore.setShowRoads(!showRoads)"
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
import { onMounted, ref, shallowRef, watch, onUnmounted, h, render } from 'vue';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMapStore } from '@/stores/mapStore';
import { storeToRefs } from "pinia";
import { PanelLeftOpen, Route, RouteOff } from 'lucide-vue-next';
import PopupCard from '@/components/map/PopupCard.vue';
import AnnotationForm from '@/components/map/AnnotationForm.vue';
import LayerSwitcher from '@/components/map/LayerSwitcher.vue';
import LanguageSwitcher from '@/components/map/LanguageSwitcher.vue';
import LabelToggle from '@/components/map/LabelToggle.vue';
import MapSidebar from '@/components/map/mapSidebar.vue';
import type { DataRecord, Annotation, SearchResult } from '../types/index.ts';
import { parseCSV } from '@/services/fileUploadService';
import { MAP_STYLES } from '@/constants/map';

// --- Store ---
const mapStore = useMapStore();
const { 
  filteredData, rawData, selectedRecordId, isSidebarOpen, 
  targetLanguage, activeLayer, annotations, searchResult,
  isAnnotationMode, groupByColumn, categoryColors, relationColumn,
  showLabels, showRoads
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

// 2. 更新瓦片图层
const updateTileLayer = () => {
  if (!map.value) return;
  
  // 1. 【关键修复】先用局部变量保存“旧图层”
  // 这样即使 tileLayerRef.value 稍后变了，oldLayer 依然指向要被删除的那个
  const oldLayer = tileLayerRef.value;
  
  // 获取当前样式配置
  const currentStyle = MAP_STYLES.find(s => s.id === activeLayer.value) || MAP_STYLES[0]!;
  
  // 2. 构建 URL
  // s.e:l|p.v:off -> Labels off
  // s.t:3|p.v:off -> Roads off (s.t:3 = feature:road)
  const styles: string[] = [];
  if (!showLabels.value) styles.push('s.e:l|p.v:off');
  if (!showRoads.value) styles.push('s.t:3|p.v:off');
  
  const apistyle = styles.length > 0 ? `&apistyle=${encodeURIComponent(styles.join(','))}` : '';
  
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

watch([activeLayer, targetLanguage, showLabels, showRoads], updateTileLayer);

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
// 4. 处理注释
watch([annotations, annotationLayerRef], ([newAnnos, layer]) => {
  if (!map.value || !layer) return;
  layer.clearLayers();

  newAnnos.forEach(anno => {
    const categoryEmoji = {
      'landmark': '🏛️',
      'home': '🏠',
      'work': '💼',
      'default': '🚩'
    }[anno.category || 'default'] || '🚩';

    const iconHtml = `
        <div class="custom-annotation-marker">
           <div class="marker-pin" style="background-color: ${anno.category === 'default' ? '#e63946' : '#2a9d8f'};">
              <span class="marker-emoji">${categoryEmoji}</span>
           </div>
           <div class="marker-label">
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

    const marker = L.marker([result.record.lat, result.record.lng], { icon: searchIcon });
    
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

// 处理 FlyTo 事件
const handleFlyTo = (event: Event) => {
  const customEvent = event as CustomEvent;
  const { lat, lng, zoom } = customEvent.detail;
  if (map.value) {
    map.value.flyTo([lat, lng], zoom || 14, {
      animate: true,
      duration: 1.5
    });
  }
};

// 地图初始化
onMounted(async () => {
  if (!mapContainer.value) return;

  // 监听 FlyTo 事件
  window.addEventListener('map:flyTo', handleFlyTo);

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
  window.removeEventListener('map:flyTo', handleFlyTo);
  if (map.value) {
    map.value.remove();
  }
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
