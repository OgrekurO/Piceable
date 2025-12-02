import { watch, type Ref, type ShallowRef, onUnmounted, shallowRef } from 'vue';
import L from 'leaflet';
import type { VisualEntity } from '@/core/models/entity';
import { useProjectStore } from '@/stores/projectStore';
import { LeafletLayer } from 'deck.gl-leaflet';
import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';

// 导入工具函数和模块
import { useMapDataTransformer } from './useMapDataTransformer';
import { useLinkEditor } from './useLinkEditor';
import { useMapZoomLevel } from './useMapZoomLevel';

type ProjectStore = ReturnType<typeof useProjectStore>;

/**
 * 地图数据可视化 Composable (基于 Deck.gl)
 * 
 * 使用 WebGL 渲染引擎,支持高性能的大规模数据可视化
 * 支持基于缩放级别的智能渲染
 */
export function useMapDataVisualization(
    map: ShallowRef<L.Map | null>,
    dataLayerRef: ShallowRef<L.FeatureGroup | null>,
    relationLayerRef: ShallowRef<L.FeatureGroup | null>,
    filteredEntities: Ref<VisualEntity[]>,
    entities: Ref<VisualEntity[]>,
    groupByColumn: Ref<string | null | undefined>,
    categoryColors: Ref<Record<string, string>>,
    projectStore: ProjectStore
) {
    // Deck.gl 实例
    const deckLayer = shallowRef<LeafletLayer | null>(null);

    // 交互状态
    const hoveredNodeId = shallowRef<string | null>(null);

    // 缩放级别管理
    const {
        currentZoom,
        updateZoom,
        shouldRenderLinks,
        shouldShowDetails,
        getNodePixelRange,
        getLinkWidthRange
    } = useMapZoomLevel(map);

    // 使用数据转换器
    const { buildNodeData, buildArcData } = useMapDataTransformer(
        entities,
        filteredEntities,
        groupByColumn,
        categoryColors,
        hoveredNodeId
    );

    // 使用连线编辑器
    const { selectedArc, updateEditHandle, clearEditMode } = useLinkEditor(
        map,
        entities,
        updateDeckLayers // 回调函数,用于触发重绘
    );

    /**
     * 更新 Deck.gl 图层
     */
    function updateDeckLayers() {
        if (!map.value || !deckLayer.value) return;

        // 更新缩放级别
        updateZoom();

        const nodeData = buildNodeData();
        const arcData = buildArcData();
        const pixelRange = getNodePixelRange.value;
        const linkWidthRange = getLinkWidthRange.value;

        const layers: any[] = [];

        // A. 连线层 (PathLayer) - 只在缩放级别足够时渲染
        if (shouldRenderLinks.value && arcData.length > 0) {
            const curveLayer = new PathLayer({
                id: 'curve-layer',
                data: arcData,

                getPath: (d) => d.path,
                getColor: (d) => d.colors,
                getWidth: (d) => Math.min(d.width, linkWidthRange.max),

                // 样式优化
                widthMinPixels: linkWidthRange.min,
                widthMaxPixels: linkWidthRange.max,
                capRounded: true,
                jointRounded: true,

                // 交互
                pickable: true,
                autoHighlight: true,
                highlightColor: [255, 221, 0, 255],

                // 点击进入编辑模式
                onClick: (info: PickingInfo) => {
                    if (!info.object) return;
                    const d = info.object as any;

                    if (selectedArc.value?.sourceId === d.sourceId &&
                        selectedArc.value?.targetId === d.originalLink.targetId) return;

                    selectedArc.value = { sourceId: d.sourceId, targetId: d.originalLink.targetId };
                    updateEditHandle(d);
                }
            });
            layers.push(curveLayer);
        }

        // B. 节点层 (ScatterplotLayer)
        const scatterLayer = new ScatterplotLayer({
            id: 'scatter-layer',
            data: nodeData,

            getPosition: (d) => d.position,
            getFillColor: (d) => d.color,
            getRadius: (d) => d.radius,

            // 根据缩放级别动态调整样式
            radiusMinPixels: pixelRange.min,
            radiusMaxPixels: pixelRange.max,
            stroked: true,
            getLineColor: [255, 255, 255],
            getLineWidth: shouldShowDetails.value ? 1 : 0.5,

            // 交互
            pickable: true,
            onHover: (info: PickingInfo) => {
                const newId = info.object ? (info.object as any).id : null;
                if (hoveredNodeId.value !== newId) {
                    hoveredNodeId.value = newId;
                    // 悬停状态改变时重绘
                    updateDeckLayers();
                }
            },
            onClick: (info: PickingInfo) => {
                if (info.object) {
                    projectStore.setSelectedEntityId((info.object as any).id);
                }
            }
        });
        layers.push(scatterLayer);

        // 更新图层
        deckLayer.value.setProps({
            layers
        });
    }

    /**
     * 初始化 Deck.gl Layer
     */
    const initializeDeckLayer = () => {
        if (!map.value) return;

        const layer = new LeafletLayer({
            layers: [],
            getTooltip: (info: PickingInfo) => {
                if (!info.object) return null;
                const object = info.object as any;

                if (info.layer?.id === 'scatter-layer') {
                    return {
                        text: object.entity.primaryLabel || object.id,
                        style: {
                            backgroundColor: '#333',
                            color: '#fff',
                            fontSize: '12px',
                            padding: '4px 8px',
                            borderRadius: '4px'
                        }
                    };
                }

                if (info.layer?.id === 'curve-layer' && object.originalLink?.label) {
                    return {
                        text: object.originalLink.label,
                        style: {
                            backgroundColor: '#333',
                            color: '#ffd700',
                            fontSize: '12px',
                            padding: '4px 8px',
                            borderRadius: '4px'
                        }
                    };
                }

                return null;
            }
        });

        layer.addTo(map.value);
        deckLayer.value = layer;

        // 点击地图空白处退出编辑模式
        map.value.on('click', () => {
            clearEditMode();
        });

        // 监听缩放事件
        map.value.on('zoomend', () => {
            updateDeckLayers();
        });
    };

    // 监听数据变化
    watch(
        [map, filteredEntities, entities, groupByColumn, categoryColors],
        () => {
            if (!deckLayer.value) {
                initializeDeckLayer();
            }
            updateDeckLayers();
        },
        { deep: true, immediate: true }
    );

    // 组件卸载时清理
    onUnmounted(() => {
        clearEditMode();
        if (deckLayer.value && map.value) {
            map.value.off('zoomend', updateDeckLayers);
            map.value.removeLayer(deckLayer.value);
            deckLayer.value = null;
        }
    });

    return {
        renderDataVisualization: updateDeckLayers,
        currentZoom,
        shouldRenderLinks
    };
}