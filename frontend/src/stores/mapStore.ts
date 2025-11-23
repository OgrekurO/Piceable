import { defineStore } from 'pinia';
import type { Bookmark, SearchResult } from '../types/map.ts';
import type { VisualEntity, BaseItem } from '../types/entity';
import type { ProjectSchema } from '../types/schema';
import { ItemTransformer } from '../services/itemTransformer';

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
    entities: [] as VisualEntity[], // Replaces rawData
    currentSchema: null as ProjectSchema | null,

    selectedEntityId: null as string | null,
    hoveredEntityId: null as string | null,

    searchTerm: '',
    isSidebarOpen: true,
    targetLanguage: 'zh-CN',
    activeLayer: 'streets',

    groupByColumn: null as string | null,
    hiddenCategories: [] as string[],
    categoryColors: {} as Record<string, string>,

    bookmarks: JSON.parse(localStorage.getItem('palladio_bookmarks') || '[]') as Bookmark[],

    searchResult: null as (SearchResult | null),
    currentView: {
      center: [34.0, 108.0] as [number, number],
      zoom: 4
    },
    showLabels: true,
    showRoads: true
  }),

  getters: {
    filteredEntities: (state): VisualEntity[] => {
      let data = state.entities;

      // Filter by Category (if grouping is active)
      // Note: This logic might need adjustment based on how we define "grouping" in the new schema
      if (state.groupByColumn) {
        data = data.filter(entity => {
          const val = String(entity.data[state.groupByColumn!] || 'Unknown');
          return !state.hiddenCategories.includes(val);
        });
      }

      // Filter by Search Term
      if (!state.searchTerm) return data;
      const lowerTerm = state.searchTerm.toLowerCase();
      return data.filter(entity => {
        // Search in primary label and raw data values
        if (entity.primaryLabel.toLowerCase().includes(lowerTerm)) return true;
        return Object.values(entity.data).some(val =>
          String(val).toLowerCase().includes(lowerTerm)
        );
      });
    },

    // Helper to get selected entity object
    selectedEntity: (state) => {
      return state.entities.find(e => e.id === state.selectedEntityId);
    }
  },

  actions: {
    /**
     * Load raw items and transform them based on the provided schema
     */
    loadItems(items: BaseItem[], schema: ProjectSchema) {
      this.currentSchema = schema;
      this.entities = ItemTransformer.transformList(items, schema);

      // Initialize colors if grouping is active (logic preserved but adapted)
      if (this.groupByColumn) {
        this.setGroupByColumn(this.groupByColumn);
      }
    },

    setSelectedEntityId(id: string | null) {
      this.selectedEntityId = id;
    },

    setHoveredEntityId(id: string | null) {
      this.hoveredEntityId = id;
    },

    setSearchTerm(term: string) {
      this.searchTerm = term;
    },

    setIsSidebarOpen(isOpen: boolean) {
      this.isSidebarOpen = isOpen;
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

      // Extract unique values from raw data
      const uniqueValues = Array.from(new Set(this.entities.map(e => String(e.data[col] || 'Unknown'))));
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

    /**
     * Add a single item (useful for local annotations/creations)
     */
    addItem(item: BaseItem) {
      // Ensure ID exists
      if (!item.id) {
        item.id = `item-${Date.now()}`;
      }
      const entity = ItemTransformer.transform(item, this.currentSchema || { fields: [] });
      this.entities.push(entity);
    },

    /**
     * Update an item
     */
    updateItem(id: string, data: Partial<BaseItem['data']>) {
      const index = this.entities.findIndex(e => e.id === id);
      if (index !== -1) {
        const currentEntity = this.entities[index];
        if (currentEntity) {
          const updatedItem: BaseItem = {
            id: currentEntity.id,
            data: { ...currentEntity.data, ...data },
            project_id: currentEntity.project_id,
            created_at: currentEntity.created_at,
            updated_at: new Date().toISOString()
          };
          // Re-transform to ensure visual properties are updated
          this.entities[index] = ItemTransformer.transform(updatedItem, this.currentSchema || { fields: [] });
        }
      }
    },

    /**
     * Remove an item
     */
    removeItem(id: string) {
      this.entities = this.entities.filter(e => e.id !== id);
      if (this.selectedEntityId === id) {
        this.selectedEntityId = null;
      }
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