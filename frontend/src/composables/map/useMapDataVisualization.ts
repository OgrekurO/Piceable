import { watch, type Ref, type ShallowRef } from 'vue';
import L from 'leaflet';
import type { VisualEntity } from '@/types/entity';
import { useProjectStore } from '@/stores/projectStore';

type ProjectStore = ReturnType<typeof useProjectStore>;

/**
 * 地图数据可视化 Composable
 * 负责标记点和关系线的渲染
 */
export function useMapDataVisualization(
    map: ShallowRef<L.Map | null>,
    dataLayerRef: ShallowRef<L.FeatureGroup | null>,
    relationLayerRef: ShallowRef<L.FeatureGroup | null>,
    filteredEntities: Ref<VisualEntity[]>,
    entities: Ref<VisualEntity[]>,
    groupByColumn: Ref<string>,
    categoryColors: Ref<Record<string, string>>,
    projectStore: ProjectStore
) {
    /**
     * 渲染数据点和关系
     */
    const renderDataVisualization = () => {
        if (!map.value || !dataLayerRef.value || !relationLayerRef.value) return;

        dataLayerRef.value.clearLayers();
        relationLayerRef.value.clearLayers();

        // 绘制标记点
        filteredEntities.value.forEach(entity => {
            if (!entity.geo) return;

            let color = '#0077b6';
            if (groupByColumn.value && categoryColors.value) {
                const val = String(entity.data[groupByColumn.value] || 'Unknown');
                color = categoryColors.value[val] || '#999';
            }

            const marker = L.circleMarker([entity.geo.lat, entity.geo.lng], {
                radius: 6,
                fillColor: color,
                color: '#fff',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.85
            });

            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                projectStore.setSelectedEntityId(entity.id);
            });

            marker.addTo(dataLayerRef.value!);

            // 绘制关系线
            if (entity.links) {
                entity.links.forEach(link => {
                    const target = entities.value.find(e => e.id === link.targetId);
                    if (target && target.geo) {
                        L.polyline([[entity.geo!.lat, entity.geo!.lng], [target.geo.lat, target.geo.lng]], {
                            color: '#999',
                            weight: 1,
                            opacity: 0.6,
                            dashArray: '5, 5'
                        }).addTo(relationLayerRef.value!);
                    }
                });
            }
        });
    };

    // 监听数据变化
    watch([filteredEntities, groupByColumn, categoryColors], renderDataVisualization, { deep: true });

    // 立即执行一次渲染(如果数据已经加载)
    if (filteredEntities.value.length > 0) {
        renderDataVisualization();
    }

    return {
        renderDataVisualization
    };
}
