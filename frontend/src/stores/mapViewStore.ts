import { ref } from 'vue';
import { defineStore, storeToRefs } from 'pinia';
import { useProjectStore } from './projectStore';

/**
 * 地图视图 Store
 * 管理地图特定的 UI 状态,并组合 projectStore 的数据访问
 */
export const useMapViewStore = defineStore('mapView', () => {
    const projectStore = useProjectStore();

    // ========== 地图视图专属状态 ==========
    const currentView = ref({
        center: [34.0, 108.0] as [number, number],
        zoom: 4
    });
    const activeLayer = ref('google-streets'); // 默认使用 Google Maps
    const showLabels = ref(true);
    const showRoads = ref(true);
    const isSidebarOpen = ref(true);

    // ========== 从 projectStore 引用共享数据 (使用 storeToRefs 保持响应性) ==========
    const {
        entities, currentSchema, selectedEntityId, hoveredEntityId, searchTerm,
        targetLanguage, groupByColumn, hiddenCategories, categoryColors, bookmarks,
        searchResult, filteredEntities, selectedEntity
    } = storeToRefs(projectStore);

    // ========== 地图视图专属 Actions ==========
    const setCurrentView = (view: { center: [number, number], zoom: number }) => {
        currentView.value = view;
    };

    const setActiveLayer = (layer: string) => {
        activeLayer.value = layer;
    };

    const setShowLabels = (show: boolean) => {
        showLabels.value = show;
    };

    const setShowRoads = (show: boolean) => {
        showRoads.value = show;
    };

    const setIsSidebarOpen = (isOpen: boolean) => {
        isSidebarOpen.value = isOpen;
    };

    // ========== 从 projectStore 引用共享 Actions ==========
    const {
        loadItems, setSelectedEntityId, setHoveredEntityId, setSearchTerm,
        setGroupByColumn, toggleCategoryVisibility, addBookmark, updateBookmark,
        removeBookmark, addItem, updateItem, removeItem, setSearchResult, setTargetLanguage
    } = projectStore;

    return {
        // 地图视图专属状态
        currentView, activeLayer, showLabels, showRoads, isSidebarOpen,

        // 共享数据 (从 projectStore)
        entities, currentSchema, selectedEntityId, hoveredEntityId, searchTerm,
        targetLanguage, groupByColumn, hiddenCategories, categoryColors, bookmarks,
        searchResult,

        // Getters (从 projectStore)
        filteredEntities, selectedEntity,

        // 地图视图专属 Actions
        setCurrentView, setActiveLayer, setShowLabels, setShowRoads, setIsSidebarOpen,

        // 共享 Actions (从 projectStore)
        loadItems, setSelectedEntityId, setHoveredEntityId, setSearchTerm,
        setGroupByColumn, toggleCategoryVisibility, addBookmark, updateBookmark,
        removeBookmark, addItem, updateItem, removeItem, setSearchResult, setTargetLanguage
    };
});

// 为了向后兼容,导出一个别名
export const useMapStore = useMapViewStore;
