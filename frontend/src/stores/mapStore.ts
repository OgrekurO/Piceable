import { defineStore } from 'pinia';
// 修复导入路径，使用相对路径确保正确解析
import type { DataRecord, Bookmark, Annotation, SearchResult } from '../types/map.ts';

// 添加调试信息
console.log('mapStore.ts: Successfully imported DataRecord, Bookmark, Annotation from ../types/map.ts');

// Palladio-inspired Palette
const COLOR_PALETTE = [
  '#E63946', // Red
  '#2A9D8F', // Teal
  '#E9C46A', // Yellow
  '#F4A261', // Orange
  '#264653', // Dark Jungle Green
  '#8D99AE', // Cool Grey
  '#EF476F', // Pink
  '#118AB2', // Blue
  '#073B4C', // Midnight
  '#06D6A0', // Green
  '#FFD166', // Pale Orange
];

export const useMapStore = defineStore('map', {
  state: () => ({
    rawData: [] as DataRecord[],
    columns: [] as string[],
    selectedRecordId: null as string | null,
    hoveredRecordId: null as string | null,
    searchTerm: '',
    isSidebarOpen: true,
    targetLanguage: 'zh-CN',
    activeLayer: 'streets',
    groupByColumn: null as string | null,
    hiddenCategories: [] as string[],
    categoryColors: {} as Record<string, string>,
    relationColumn: null as string | null,
    bookmarks: JSON.parse(localStorage.getItem('palladio_bookmarks') || '[]') as Bookmark[],
    annotations: JSON.parse(localStorage.getItem('palladio_annotations') || '[]') as Annotation[],
    isAnnotationMode: false,
    searchResult: null as (SearchResult | null),
    currentView: {
      center: [34.0, 108.0] as [number, number],
      zoom: 4
    },
    showLabels: true,
    showRoads: true
  }),

  getters: {
    filteredData: (state): DataRecord[] => {
      let data = state.rawData;

      // Filter by Category (if grouping is active)
      if (state.groupByColumn) {
        data = data.filter(record => {
          const val = String(record[state.groupByColumn!] || 'Unknown');
          return !state.hiddenCategories.includes(val);
        });
      }

      // Filter by Search Term
      if (!state.searchTerm) return data;
      const lowerTerm = state.searchTerm.toLowerCase();
      return data.filter(record => {
        return Object.values(record).some(val =>
          String(val).toLowerCase().includes(lowerTerm)
        );
      });
    }
  },

  actions: {
    setRawData(data: DataRecord[]) {
      this.rawData = data;
      this.columns = Object.keys(data[0] || {});
    },

    setSelectedRecordId(id: string | null) {
      this.selectedRecordId = id;
    },

    setHoveredRecordId(id: string | null) {
      this.hoveredRecordId = id;
    },

    setSearchTerm(term: string) {
      this.searchTerm = term;
    },

    setIsSidebarOpen(isOpen: boolean) {
      this.isSidebarOpen = isOpen;
    },

    setTargetLanguage(lang: string) {
      this.targetLanguage = lang;
    },

    setActiveLayer(layer: string) {
      this.activeLayer = layer;
    },

    setGroupByColumn(col: string | null) {
      this.groupByColumn = col;
      this.hiddenCategories = [];

      if (!col) {
        this.categoryColors = {};
        return;
      }

      const uniqueValues = Array.from(new Set(this.rawData.map(r => String(r[col] || 'Unknown'))));
      const newColors: Record<string, string> = {};
      uniqueValues.forEach((val, index) => {
        newColors[val] = COLOR_PALETTE[index % COLOR_PALETTE.length] || '#000000';
      });
      this.categoryColors = newColors;
    },

    toggleCategoryVisibility(value: string) {
      const index = this.hiddenCategories.indexOf(value);
      if (index === -1) {
        this.hiddenCategories.push(value);
      } else {
        this.hiddenCategories.splice(index, 1);
      }
    },

    addBookmark(name: string, view: { center: [number, number], zoom: number, layer: string }) {
      const newBookmark: Bookmark = {
        id: Date.now().toString(),
        name,
        view,
        timestamp: Date.now()
      };
      this.bookmarks.push(newBookmark);
      localStorage.setItem('palladio_bookmarks', JSON.stringify(this.bookmarks));
    },

    updateBookmark(id: string, name: string) {
      const bookmark = this.bookmarks.find(b => b.id === id);
      if (bookmark) {
        bookmark.name = name;
        localStorage.setItem('palladio_bookmarks', JSON.stringify(this.bookmarks));
      }
    },

    removeBookmark(id: string) {
      this.bookmarks = this.bookmarks.filter(b => b.id !== id);
      localStorage.setItem('palladio_bookmarks', JSON.stringify(this.bookmarks));
    },

    addAnnotation(annotation: Annotation) {
      this.annotations.push(annotation);
      localStorage.setItem('palladio_annotations', JSON.stringify(this.annotations));
    },

    updateAnnotation(id: string, data: Partial<Annotation>) {
      const annotation = this.annotations.find(a => a.id === id);
      if (annotation) {
        Object.assign(annotation, data);
        localStorage.setItem('palladio_annotations', JSON.stringify(this.annotations));
      }
    },

    removeAnnotation(id: string) {
      this.annotations = this.annotations.filter(a => a.id !== id);
      localStorage.setItem('palladio_annotations', JSON.stringify(this.annotations));
    },

    setIsAnnotationMode(isMode: boolean) {
      this.isAnnotationMode = isMode;
    },

    setSearchResult(result: SearchResult | null) {
      this.searchResult = result;
    },

    setCurrentView(view: { center: [number, number], zoom: number }) {
      this.currentView = view;
    },

    setShowLabels(show: boolean) {
      this.showLabels = show;
    },

    setShowRoads(show: boolean) {
      this.showRoads = show;
    }
  }
});