import { shallowRef, onUnmounted, type Ref } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapViewStore } from '@/stores/mapViewStore';

/**
 * 地图核心管理 Composable
 * 负责地图实例初始化、图层组管理、事件监听和清理
 */
export function useMapCore(mapViewStore: MapViewStore) {
    // 使用 shallowRef 避免 Vue 深度代理 Leaflet 实例，提升性能
    const map = shallowRef<L.Map | null>(null);
    const dataLayerRef = shallowRef<L.FeatureGroup | null>(null);
    const relationLayerRef = shallowRef<L.FeatureGroup | null>(null);
    const searchLayerRef = shallowRef<L.FeatureGroup | null>(null);

    /**
     * 处理 FlyTo 事件
     */
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

    /**
     * 初始化地图
     */
    const initializeMap = (container: HTMLElement) => {
        // 监听 FlyTo 事件
        window.addEventListener('map:flyTo', handleFlyTo);

        // 初始化地图
        map.value = L.map(container, {
            center: [34.0, 108.0],
            zoom: 4,
            zoomControl: false // 使用自定义控件
        });

        // 初始化图层组
        dataLayerRef.value = L.featureGroup().addTo(map.value);
        relationLayerRef.value = L.featureGroup().addTo(map.value);
        searchLayerRef.value = L.featureGroup().addTo(map.value);

        // 添加地图事件监听器
        map.value.on('moveend', () => {
            if (map.value) {
                const center = map.value.getCenter();
                const zoom = map.value.getZoom();
                mapViewStore.setCurrentView({
                    center: [center.lat, center.lng],
                    zoom
                });
            }
        });
    };

    /**
     * 清理资源
     */
    const cleanup = () => {
        window.removeEventListener('map:flyTo', handleFlyTo);
        if (map.value) {
            map.value.remove();
        }
    };

    // 组件卸载时自动清理
    onUnmounted(() => {
        cleanup();
    });

    return {
        map,
        dataLayerRef,
        relationLayerRef,
        searchLayerRef,
        initializeMap,
        handleFlyTo,
        cleanup
    };
}
