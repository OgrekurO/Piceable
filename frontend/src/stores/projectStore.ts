import { defineStore } from 'pinia';
import type { Bookmark, SearchResult } from '@/core/models/view';
import type { VisualEntity, BaseItem } from '@/core/models/entity';
import type { ProjectSchema } from '@/core/models/schema';
import { ItemTransformer } from '@/core/transformers/itemTransformer';

const COLOR_PALETTE = [
    '#E63946', '#2A9D8F', '#E9C46A', '#F4A261', '#264653',
    '#8D99AE', '#EF476F', '#118AB2', '#073B4C', '#06D6A0', '#FFD166',
];

export const useProjectStore = defineStore('project', {
    state: () => ({
        entities: [] as VisualEntity[],
        currentSchema: null as ProjectSchema | null,
        selectedEntityId: null as string | null,
        hoveredEntityId: null as string | null,
        searchTerm: '',
        targetLanguage: 'zh-CN',
        groupByColumn: null as string | null,
        hiddenCategories: [] as string[],
        categoryColors: {} as Record<string, string>,
        bookmarks: JSON.parse(localStorage.getItem('palladio_bookmarks') || '[]') as Bookmark[],
        searchResult: null as (SearchResult | null),
    }),
    getters: {
        filteredEntities: (state): VisualEntity[] => {
            let data = state.entities;
            if (state.groupByColumn) {
                data = data.filter(entity => {
                    const val = String(entity.data[state.groupByColumn!] || 'Unknown');
                    return !state.hiddenCategories.includes(val);
                });
            }
            if (!state.searchTerm) return data;
            const lowerTerm = state.searchTerm.toLowerCase();
            return data.filter(entity => {
                if (entity.primaryLabel.toLowerCase().includes(lowerTerm)) return true;
                return Object.values(entity.data).some(val =>
                    String(val).toLowerCase().includes(lowerTerm)
                );
            });
        },
        selectedEntity: (state) => {
            return state.entities.find(e => e.id === state.selectedEntityId);
        }
    },
    actions: {
        loadItems(items: BaseItem[], schema: ProjectSchema) {
            this.currentSchema = schema;
            this.entities = ItemTransformer.transformList(items, schema);
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
        setGroupByColumn(col: string | null) {
            this.groupByColumn = col;
            this.hiddenCategories = [];
            if (!col) {
                this.categoryColors = {};
                return;
            }
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
        addItem(item: BaseItem) {
            if (!item.id) {
                item.id = `item-${Date.now()}`;
            }
            const entity = ItemTransformer.transform(item, this.currentSchema || { fields: [] });
            this.entities.push(entity);
        },
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
                    this.entities[index] = ItemTransformer.transform(updatedItem, this.currentSchema || { fields: [] });
                }
            }
        },
        removeItem(id: string) {
            this.entities = this.entities.filter(e => e.id !== id);
            if (this.selectedEntityId === id) {
                this.selectedEntityId = null;
            }
        },
        setSearchResult(result: SearchResult | null) {
            this.searchResult = result;
        },
        setTargetLanguage(lang: string) {
            this.targetLanguage = lang;
        }
    }
});
