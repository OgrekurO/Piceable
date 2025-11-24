import { h, render, watch, type Ref, type ShallowRef } from 'vue';
import L from 'leaflet';
import PopupCard from '@/components/visualizers/Map/PopupCard.vue';
import type { SearchResult } from '@/types/map';
import type { VisualEntity } from '@/types/entity';
import { useProjectStore } from '@/stores/projectStore';

type ProjectStore = ReturnType<typeof useProjectStore>;

/**
 * 地图弹窗管理 Composable
 * 负责 Vue 组件绑定到 Leaflet Popup 和弹窗生命周期管理
 */
export function useMapPopup(
    map: ShallowRef<L.Map | null>,
    searchLayerRef: ShallowRef<L.FeatureGroup | null>,
    filteredEntities: Ref<VisualEntity[]>,
    selectedEntityId: Ref<string | null>,
    searchResult: Ref<SearchResult | null>,
    targetLanguage: Ref<string | null>,
    projectStore: ProjectStore
) {
    /**
     * 将 Vue 组件绑定到 Leaflet Popup
     */
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

    /**
     * 显示搜索结果弹窗
     */
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

            const marker = L.marker([result.record.geo!.lat, result.record.geo!.lng], { icon: searchIcon });

            const popup = bindVuePopup(marker, PopupCard, {
                data: result,
                type: "search",
                onClose: () => marker.closePopup()
            });

            marker.addTo(searchLayerRef.value!);
            marker.openPopup();
        }
    });

    /**
     * 显示选中实体的弹窗
     */
    watch([selectedEntityId, targetLanguage], ([id, lang]) => {
        if (!map.value) return;

        if (id) {
            map.value.closePopup(); // close existing
            const entity = filteredEntities.value.find(e => e.id === id);

            if (entity && entity.geo) {
                const container = document.createElement('div');
                const popup = L.popup({
                    minWidth: 280,
                    maxWidth: 320,
                    closeButton: false,
                    offset: [0, -10],
                    className: 'custom-popup'
                })
                    .setLatLng([entity.geo.lat, entity.geo.lng])
                    .setContent(container)
                    .openOn(map.value);

                // Mount Vue Component
                render(h(PopupCard, {
                    data: entity,
                    type: "record",
                    targetLanguage: lang,
                    onClose: () => projectStore.setSelectedEntityId(null),
                    onDelete: () => {
                        if (window.confirm(`删除 "${entity.primaryLabel}"?`)) {
                            projectStore.removeItem(entity.id);
                            map.value?.closePopup();
                        }
                    }
                }), container);

                // Cleanup on close
                popup.on('remove', () => {
                    render(null, container);
                });
            }
        }
    });

    return {
        bindVuePopup
    };
}
