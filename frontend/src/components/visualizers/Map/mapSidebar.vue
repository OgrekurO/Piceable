<template>
  <div class="sidebar-root">
    <!-- Header -->
    <div class="sidebar-header">
      <!-- Collapse Button aligned with title -->
      <button 
        @click="setIsSidebarOpen(false)"
        class="collapse-btn"
        title="收起侧边栏"
      >
        <ChevronLeft :size="20" />
      </button>
    </div>

    <div class="sidebar-content custom-scrollbar">
      
      <!-- 1. Search / Retrieval -->
      <ModuleHeader 
        :title="'地理信息检索'" 
        :icon="Search" 
        :is-open="!!openModules['search']" 
        @toggle="toggleModule('search')" 
      />
      <div v-if="openModules['search']" class="module-content has-spacing relative z-50">
         <!-- Search Input Container -->
         <div class="search-container">
           <input 
             v-model="addressQuery"
             @input="handleSearchInput"
             class="search-input"
             placeholder="搜索地点、地址或坐标..."
           />
           <div class="search-icon-wrapper">
             <div v-if="isSearching">
               <Loader2 :size="16" class="animate-spin" />
             </div>
             <div v-else-if="addressQuery">
               <button @click="addressQuery = ''; suggestions = []" class="hover:text-gray-600">
                 <X :size="16" />
               </button>
             </div>
             <div v-else>
               <Search :size="16" />
             </div>
           </div>

           <!-- Autocomplete Dropdown -->
           <div v-if="suggestions.length > 0" class="suggestions-dropdown custom-scrollbar">
             <div 
               v-for="(res, i) in suggestions" 
               :key="i" 
               class="suggestion-item"
               @click="handleSelectSuggestion(res)"
             >
               <span class="font-medium text-gray-800">{{ res.display_name.split(',')[0] }}</span>
               <span class="text-xs text-gray-500 truncate">{{ res.display_name }}</span>
             </div>
           </div>
         </div>

         <!-- Quick POI Buttons -->
         <div class="poi-section">
            <div class="section-title">快速搜索 (POI)</div>
            <div class="poi-tags">
              <button 
                v-for="poi in ['博物馆', '学校', '公园', '医院', '餐厅', '古迹', '地铁站']"
                :key="poi"
                @click="handleQuickSearch(poi)"
                class="poi-btn"
              >
                {{ poi }}
              </button>
            </div>
         </div>
      </div>

      <!-- 2. Visualization & Analysis (NEW) -->
      <ModuleHeader 
        :title="'可视化与分析'" 
        :icon="PieChart" 
        :is-open="!!openModules['viz']" 
        @toggle="toggleModule('viz')" 
      />
      <div v-if="openModules['viz']" class="module-content has-spacing">
        <div v-if="entities.length === 0" class="empty-state-text">
          请先上传数据以使用分析功能
        </div>
        <template v-else>
          <!-- Group By Control -->
          <div>
              <label class="control-label">分类着色 (Group By)</label>
              <select 
                  :value="groupByColumn"
                  @change="(e) => setGroupByColumn((e.target as HTMLSelectElement).value || null)"
                  class="styled-select"
              >
                  <option value="">-- 默认 (统一颜色) --</option>
                  <option 
                    v-for="col in columns.filter(c => !['lat','lng','id','latitude','longitude'].includes(c.toLowerCase()))" 
                    :key="col" 
                    :value="col"
                  >
                    {{ col }}
                  </option>
              </select>
          </div>

          <!-- Legend & Faceting -->
          <div v-if="groupByColumn" class="legend-container custom-scrollbar">
              <div class="legend-header">
                  <span>图例与筛选 ({{ Object.keys(categoryColors).length }})</span>
              </div>
              <div class="space-y-1">
                  <div 
                      v-for="[val, color] in Object.entries(categoryColors)" 
                      :key="val" 
                      class="legend-item"
                      :class="{ 'is-hidden': hiddenCategories.includes(val) }"
                      @click="toggleCategoryVisibility(val)"
                  >
                      <div 
                          class="color-dot" 
                          :style="{ backgroundColor: color }"
                      />
                      <span class="flex-1 truncate" :title="val">{{ val }}</span>
                      <span class="text-muted">
                          <component :is="hiddenCategories.includes(val) ? EyeOff : Eye" :size="12" />
                      </span>
                  </div>
              </div>
          </div>

          <!-- Relation Info -->
          <div v-if="relationColumn" class="info-box">
              <GitMerge :size="14" class="mr-2" />
              <span>检测到关联字段 "{{ relationColumn }}"，已自动绘制连线。</span>
          </div>
        </template>
      </div>

      <!-- 3. Bookmarks -->
      <ModuleHeader 
        :title="'书签 / 收藏'" 
        :icon="Bookmark" 
        :is-open="!!openModules['bookmarks']" 
        @toggle="toggleModule('bookmarks')" 
      />
      <div v-if="openModules['bookmarks']" class="module-content">
        <!-- Add Bookmark UI -->
        <div v-if="!isAddingBookmark">
            <button 
                @click="isAddingBookmark = true"
                class="action-btn"
            >
                <Plus :size="16" class="mr-2"/> 收藏当前视角
            </button>
        </div>
        <div v-else class="add-bookmark-form animate-in fade-in slide-in-from-top-2">
            <label class="control-label">命名新书签</label>
            <input 
                v-model="newBookmarkName"
                class="form-input"
                placeholder="例如: 研究区域 A..."
                autofocus
            />
            <div class="flex justify-end gap-2">
                <button 
                    @click="isAddingBookmark = false"
                    class="btn-text"
                >
                    取消
                </button>
                <button 
                    @click="handleAddBookmark"
                    :disabled="!newBookmarkName.trim()"
                    class="btn-primary"
                >
                    保存
                </button>
            </div>
        </div>

        <!-- Bookmarks List -->
        <div class="space-y-2">
          <div v-if="bookmarks.length === 0 && !isAddingBookmark" class="empty-state-text py-4">
             暂无收藏视图. 移动地图并点击上方按钮保存.
          </div>
          <div 
            v-for="b in bookmarks" 
            :key="b.id" 
            class="list-item-card group"
          >
             <div v-if="editingBookmarkId === b.id">
                 <!-- Edit Mode -->
                 <div class="flex items-center gap-2">
                     <input 
                         v-model="editName"
                         class="form-input-mini"
                         autofocus
                     />
                     <button @click="saveEditBookmark" class="icon-btn text-success">
                         <Check :size="14" />
                     </button>
                     <button @click="editingBookmarkId = null" class="icon-btn text-muted">
                         <X :size="14" />
                     </button>
                 </div>
             </div>
             <div v-else>
                 <!-- View Mode -->
                 <div class="flex justify-between items-center">
                      <div 
                          class="flex-1 cursor-pointer"
                          @click="handleRestoreBookmark(b)"
                      >
                          <div class="item-title">
                              <Bookmark :size="12" class="mr-1.5 text-palladio-gold" fill="currentColor" />
                              {{ b.name }}
                          </div>
                          <div class="item-subtitle pl-4">
                              缩放: {{ b.view.zoom.toFixed(1) }} | {{ b.view.layer === 'streets' ? '街道' : b.view.layer === 'satellite' ? '卫星' : '自定义' }}
                          </div>
                      </div>
                      <div class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <button 
                              @click="startEditBookmark(b)" 
                              class="icon-btn hover-primary mr-1"
                              title="重命名"
                          >
                              <Edit2 :size="12" />
                          </button>
                          <button 
                              @click="removeBookmark(b.id)" 
                              class="icon-btn hover-danger"
                              title="删除"
                          >
                              <Trash2 :size="12" />
                          </button>
                      </div>
                 </div>
             </div>
          </div>
        </div>
      </div>

      <!-- 4. Annotations (Merged into Items) -->
      <!-- Removed specific Annotation module as it is now integrated into the main data flow -->


      <!-- 5. Upload & Data -->
      <ModuleHeader 
        :title="'数据管理'" 
        :icon="UploadCloud" 
        :is-open="!!openModules['data']" 
        @toggle="toggleModule('data')" 
      />
      <div v-if="openModules['data']" class="border-b border-gray-100">
        <!-- Upload Area -->
        <div class="upload-section">
          <div 
            class="upload-box"
            @click="triggerFileInput"
            @dragover.prevent
            @drop.prevent="handleFiles"
          >
            <UploadCloud class="mx-auto text-gray-400 mb-2" :size="24" />
            <div class="text-xs text-gray-600 font-medium">点击或拖拽上传 CSV</div>
            <div class="text-xs text-gray-500 mt-1">支持 lat, lng, label 等字段</div>
            <input 
              id="csv-upload" 
              type="file" 
              accept=".csv" 
              class="hidden" 
              ref="fileInputRef"
              @change="handleFiles" 
            />
          </div>
        </div>

        <!-- Data Actions -->
        <div v-if="entities.length > 0" class="p-4 bg-gray-50">
          <div class="flex justify-between items-center mb-3 text-xs text-gray-500">
            <span>已加载 {{ entities.length }} 条记录</span>
            <button @click="clearData" class="text-red-500 hover:text-red-700 flex items-center">
              <Trash2 :size="12" class="mr-1" /> 清空
            </button>
          </div>
          
          <button 
            @click="isDataTableOpen = true"
            class="w-full flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 rounded hover:border-palladio-blue hover:text-palladio-blue transition-colors text-sm text-gray-600"
          >
            <Table :size="16" />
            查看完整数据表
          </button>
        </div>
      </div>

      <!-- 6. Export -->
      <ModuleHeader 
        :title="'导出视图'" 
        :icon="Share2" 
        :is-open="!!openModules['export']" 
        @toggle="toggleModule('export')" 
      />
      <div v-if="openModules['export']" class="module-content p-4 space-y-3">
         <div class="text-sm text-gray-600 mb-2">分享或下载当前地图视图</div>
         
         <div class="grid grid-cols-2 gap-2">
           <button @click="exportMapImage('png')" class="export-btn flex items-center justify-center">
             <Download :size="16" class="mr-2" />
             导出 PNG
           </button>
           <button @click="exportMapImage('svg')" class="export-btn flex items-center justify-center">
             <Download :size="16" class="mr-2" />
             导出 SVG
           </button>
         </div>

         <button 
           @click="copyViewLink"
           class="w-full py-2 flex items-center justify-center text-sm text-gray-600 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
         >
           <ExternalLink :size="16" class="mr-2" />
           复制视图链接
         </button>
      </div>

    </div>
    
    <!-- Data Table Modal -->
    <DataTableModal 
      :is-open="isDataTableOpen"
      :data="entities.map(e => e.data)"
      :columns="columns"
      @close="isDataTableOpen = false"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useMapStore } from '@/stores/mapStore';
import { storeToRefs } from 'pinia';
import { Search, Bookmark, MapPin, UploadCloud, Share2, ChevronDown, ChevronRight, Trash2, Plus, Download, ExternalLink, ChevronLeft, X, Loader2, Edit2, Check, Save, PieChart, GitMerge, Eye, EyeOff, Table } from 'lucide-vue-next';
import ModuleHeader from './ModuleHeader.vue';
import DataTableModal from './DataTableModal.vue';
import { toPng, toSvg } from 'html-to-image';
import type { BaseItem } from '@/types/entity';

// 使用 mapStore
const mapStore = useMapStore();
const {
  entities, // Replaces rawData
  searchTerm,
  filteredEntities, // Replaces filteredData
  selectedEntityId, // Replaces selectedRecordId
  isSidebarOpen,
  bookmarks,
  currentView,
  activeLayer,
  searchResult,
  groupByColumn,
  categoryColors,
  hiddenCategories,
  // relationColumn // Removed from store, now derived from schema or data
} = storeToRefs(mapStore);

const {
  setIsSidebarOpen,
  addBookmark,
  updateBookmark,
  removeBookmark,
  removeItem, // Replaces removeAnnotation
  setActiveLayer,
  setSearchResult,
  setGroupByColumn,
  toggleCategoryVisibility,
  loadItems, // Replaces setRawData
  setSelectedEntityId // Replaces setSelectedRecordId
} = mapStore;

// Computed Columns (derived from first entity's data)
const columns = computed(() => {
  const first = entities.value[0];
  if (first && first.data) {
    return Object.keys(first.data);
  }
  return [];
});

// Computed Relation Column (Simple heuristic: find column ending in 'Id' or 'ID' that is not 'id')
const relationColumn = computed(() => {
    if (columns.value.length === 0) return null;
    return columns.value.find(col => 
        (col.toLowerCase().endsWith('id') && col.toLowerCase() !== 'id') || 
        col === 'parent' || 
        col === 'target'
    ) || null;
});

// Accordion State
const openModules = ref<Record<string, boolean>>({
  'search': true,
  'viz': true,
  'bookmarks': false,
  'annotations': false,
  'data': false,
  'export': false
});

const toggleModule = (key: string) => {
  openModules.value[key] = !openModules.value[key];
};

// --- Search Logic (Autocomplete) ---
const addressQuery = ref('');
const suggestions = ref<any[]>([]);
const isSearching = ref(false);
let searchTimeout: any = null;

const handleSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  if (!addressQuery.value || addressQuery.value.length < 2) {
    suggestions.value = [];
    return;
  }

  searchTimeout = setTimeout(async () => {
    isSearching.value = true;
    try {
      // 使用 OSM Nominatim API
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery.value)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        suggestions.value = data;
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      isSearching.value = false;
    }
  }, 500); // Debounce 500ms
};

const handleSelectSuggestion = (item: any) => {
  addressQuery.value = item.display_name.split(',')[0];
  suggestions.value = [];
  
  const lat = parseFloat(item.lat);
  const lng = parseFloat(item.lon);

  // Update Context State
  mapStore.setSearchResult({
    record: {
      id: `search-${Date.now()}`,
      primaryLabel: item.display_name.split(',')[0],
      data: {
        address: item.display_name,
        type: item.type
      },
      geo: {
        lat,
        lng
      }
    } as any,
    score: 1
  });

  // Fly to location
  window.dispatchEvent(new CustomEvent('map:flyTo', { detail: { lat, lng, zoom: 13 } }));
};

const handleQuickSearch = (poi: string) => {
  addressQuery.value = poi;
  handleSearchInput();
};

// --- Bookmark Logic ---
const isAddingBookmark = ref(false);
const newBookmarkName = ref('');
const editingBookmarkId = ref<string | null>(null);
const editName = ref('');

const handleAddBookmark = () => {
  if (!newBookmarkName.value.trim()) return;
  mapStore.addBookmark(newBookmarkName.value, { ...currentView.value, layer: activeLayer.value });
  newBookmarkName.value = '';
  isAddingBookmark.value = false;
};

const startEditBookmark = (b: typeof bookmarks.value[0]) => {
  editingBookmarkId.value = b.id;
  editName.value = b.name;
};

const saveEditBookmark = () => {
  if (editingBookmarkId.value && editName.value.trim()) {
      mapStore.updateBookmark(editingBookmarkId.value, editName.value);
      editingBookmarkId.value = null;
  }
};

const handleRestoreBookmark = (b: typeof bookmarks.value[0]) => {
  if (editingBookmarkId.value) return; // Don't restore if editing
  mapStore.setActiveLayer(b.view.layer); // Restore layer
  window.dispatchEvent(new CustomEvent('map:flyTo', { 
      detail: { 
          lat: b.view.center[0], 
          lng: b.view.center[1], 
          zoom: b.view.zoom 
      } 
  }));
};

// --- CSV Logic ---
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDataTableOpen = ref(false);

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFiles = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;
  try {
    const file = files[0];
    if (!file) return;
    const text = await file.text();
    const rows = text.split('\n').filter(row => row.trim() !== '');
    if (rows.length < 2) return;
    
    const headerRow = rows[0];
    if (!headerRow) return;
    const headers = headerRow.split(',').map(header => header.trim());
    const data = rows.slice(1).map((row, index) => {
      const values = row.split(',').map(value => value.trim());
      const record: Record<string, any> = { id: `record-${index}` };
      headers.forEach((header, i) => {
        const val = values[i] || '';
        // Normalize lat/lng keys
        if (header.toLowerCase() === 'lat' || header.toLowerCase() === 'latitude') {
          record.lat = parseFloat(val);
        } else if (header.toLowerCase() === 'lng' || header.toLowerCase() === 'longitude') {
          record.lng = parseFloat(val);
        } else {
          record[header] = val;
        }
      });
      return record;
    }).filter(record => record.lat !== undefined && record.lng !== undefined && !isNaN(record.lat) && !isNaN(record.lng));
    
    // Convert to BaseItem[]
    const items: BaseItem[] = data.map(d => ({
        id: d.id,
        data: d
    }));

    // Define Schema based on headers
    const schema = {
        fields: headers.map(h => {
            let type = 'text';
            const lower = h.toLowerCase();
            if (lower === 'lat' || lower === 'latitude' || lower === 'lng' || lower === 'longitude') type = 'geo_point';
            return { key: h, label: h, type: type as any };
        })
    };

    mapStore.loadItems(items, schema as any);
  } catch (err) {
    alert("CSV 解析错误");
    console.error(err);
  }
};

const clearData = () => {
  mapStore.loadItems([], { fields: [] });
};

// --- Other Actions ---
const selectRecord = (id: string) => {
  mapStore.setSelectedEntityId(id);
  const entity = mapStore.entities.find(e => e.id === id);
  if (entity && entity.geo) {
    window.dispatchEvent(new CustomEvent('map:flyTo', { detail: { lat: entity.geo.lat, lng: entity.geo.lng, zoom: 14 } }));
  }
};

const flyTo = (lat: number, lng: number, zoom: number) => {
  window.dispatchEvent(new CustomEvent('map:flyTo', { detail: { lat, lng, zoom } }));
};

const copyViewLink = () => {
  const url = `${window.location.origin}?lat=${currentView.value.center[0]}&lng=${currentView.value.center[1]}&zoom=${currentView.value.zoom}`;
  navigator.clipboard.writeText(url);
  alert('当前视图链接已复制到剪贴板！');
};

const exportMapImage = async (format: 'png' | 'svg') => {
  const mapElement = document.querySelector('.map-element') as HTMLElement;
  if (!mapElement) return;

  try {
    let dataUrl = '';
    if (format === 'svg') {
      dataUrl = await toSvg(mapElement);
    } else {
      dataUrl = await toPng(mapElement);
    }
    
    const link = document.createElement('a');
    link.download = `map-export-${Date.now()}.${format}`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Export failed:', error);
    alert('导出失败，请重试');
  }
};
</script>

<style scoped>
.sidebar-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: white;
}

.sidebar-header {
  height: 3rem; /* h-16 */
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 1rem;
  flex-shrink: 0;
  background-color: #f9fafb;
}

.header-title {
  font-family: serif;
  font-size: 1.125rem; /* text-lg */
  font-weight: 700;
  color: #1f2937;
}

.collapse-btn {
  padding: 0.5rem;
  color: #6b7280;
  background: none;
  border: none;
  border-radius: 9999px;
  transition: color 0.2s, background-color 0.2s;
}

.collapse-btn:hover {
  color: var(--palladio-blue, #0077b6);
  background-color: #e5e7eb;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
}

/* Module Content Generic */
.module-content {
  padding: 1rem;
  background-color: rgba(249, 250, 251, 0.5);
  border-bottom: 1px solid #f3f4f6;
}

.module-content.has-spacing > * + * {
  margin-top: 1rem;
}

/* Search Module */
.search-container {
  position: relative;
}

.search-input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  padding: 0.5rem 0.75rem;
  padding-right: 2.5rem;
  font-size: 0.875rem;
  outline: none;
  transition: box-shadow 0.2s;
}

.search-input:focus {
  border-color: var(--palladio-blue, #0077b6);
  box-shadow: 0 0 0 1px var(--palladio-blue, #0077b6);
}

.search-icon-wrapper {
  position: absolute;
  right: 0.5rem;
  top: 0.625rem;
  color: #9ca3af;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 15rem;
  overflow-y: auto;
}

.suggestion-item {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  font-size: 0.875rem;
  border-bottom: 1px solid #f9fafb;
  display: flex;
  flex-direction: column;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background-color: #eff6ff;
}

.poi-section {
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #9ca3af;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

.poi-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.poi-btn {
  padding: 0.25rem 0.5rem;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: #4b5563;
  transition: all 0.2s;
  cursor: pointer;
}

.poi-btn:hover {
  border-color: var(--palladio-blue, #0077b6);
  color: var(--palladio-blue, #0077b6);
}

/* Viz Module */
.styled-select {
  width: 100%;
  font-size: 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  padding: 0.375rem 0.5rem;
  background-color: white;
  outline: none;
}

.styled-select:focus {
  border-color: var(--palladio-blue, #0077b6);
}

.control-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
}

.legend-container {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  padding: 0.75rem;
  max-height: 15rem;
  overflow-y: auto;
}

.legend-header {
  font-size: 0.75rem;
  font-weight: 700;
  color: #6b7280;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  padding: 0.25rem;
  border-radius: 0.25rem;
  cursor: pointer;
}

.legend-item:hover {
  background-color: #f9fafb;
}

.legend-item.is-hidden {
  opacity: 0.5;
}

.color-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 9999px;
  flex-shrink: 0;
  border: 1px solid rgba(0,0,0,0.1);
}

.info-box {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: var(--palladio-blue, #0077b6);
  background-color: #eff6ff;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #dbeafe;
}

/* Bookmarks & Annotations */
.action-btn {
  width: 100%;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.action-btn:hover {
  color: var(--palladio-blue, #0077b6);
  border-color: var(--palladio-blue, #0077b6);
}

.mode-toggle-btn {
  width: 100%;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  border: 1px solid #d1d5db;
  background-color: white;
  color: #374151;
}

.mode-toggle-btn:hover {
  border-color: var(--palladio-blue, #0077b6);
  color: var(--palladio-blue, #0077b6);
}

.mode-toggle-btn.active {
  background-color: #fef2f2; /* bg-red-50 */
  border-color: #fecaca; /* border-red-200 */
  color: #dc2626; /* text-red-600 */
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.add-bookmark-form {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: white;
  border: 1px solid var(--palladio-blue, #0077b6);
  border-radius: 0.25rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.form-input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  padding: 0.375rem 0.5rem;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  outline: none;
}

.form-input:focus {
  border-color: var(--palladio-blue, #0077b6);
}

.form-input-mini {
  flex: 1;
  border: 1px solid #93c5fd;
  border-radius: 0.25rem;
  padding: 0.125rem 0.25rem;
  font-size: 0.875rem;
  outline: none;
}

.btn-primary {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  background-color: var(--palladio-blue, #0077b6);
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.5;
}

.btn-text {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  background: none;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

.btn-text:hover {
  background-color: #f3f4f6;
}

.list-item-card {
  background-color: white;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}

.list-item-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.item-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #374151;
  display: flex;
  align-items: center;
}

.item-subtitle {
  font-size: 0.625rem;
  color: #9ca3af;
  margin-top: 0.125rem;
}

.icon-btn {
  padding: 0.375rem;
  background: none;
  border: none;
  border-radius: 0.25rem;
  color: #9ca3af;
  cursor: pointer;
}

.icon-btn.hover-primary:hover {
  color: #2563eb;
  background-color: #eff6ff;
}

.icon-btn.hover-danger:hover {
  color: #dc2626;
  background-color: #fef2f2;
}

.category-badge {
  margin-right: 0.25rem;
  font-size: 0.625rem;
  background-color: #f3f4f6;
  padding: 0 0.25rem;
  border-radius: 0.25rem;
  color: #6b7280;
}

.instruction-text {
  font-size: 0.75rem;
  text-align: center;
  color: #6b7280;
  margin-bottom: 0.75rem;
  font-style: italic;
}

/* Data Module */
.upload-section {
  padding: 1rem;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.upload-box {
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.upload-box:hover {
  border-color: var(--palladio-blue, #0077b6);
}

.data-list-container {
  display: flex;
  flex-direction: column;
  max-height: 24rem;
}

.data-item {
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f9fafb;
}

.data-item:last-child {
  border-bottom: none;
}

.data-item:hover {
  background-color: #eff6ff;
}

/* Export Module */
.export-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  color: #374151;
  transition: background-color 0.2s;
}

.export-btn:hover {
  background-color: #f9fafb;
}

/* Footer */
.sidebar-footer {
  padding: 0.75rem;
  background-color: #f3f4f6;
  font-size: 0.625rem;
  text-align: center;
  color: #9ca3af;
  flex-shrink: 0;
}

/* Utilities */
.empty-state-text {
  font-size: 0.75rem;
  color: #9ca3af;
  font-style: italic;
  text-align: center;
}

.text-muted { color: #9ca3af; }
.text-primary { color: var(--palladio-blue, #0077b6); }
.text-danger { color: #ef4444; }
.text-success { color: #16a34a; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}
</style>