import { shallowRef, watch, type Ref, type ShallowRef } from 'vue';
import L from 'leaflet';
import { MAP_STYLES, MAP_PROVIDERS } from '@/core/constants/map';

/**
 * 瓦片图层管理 Composable
 * 负责瓦片图层的创建、更新和样式应用
 */
export function useMapTileLayer(
    map: ShallowRef<L.Map | null>,
    activeLayer: Ref<string>,
    targetLanguage: Ref<string | null>,
    showLabels: Ref<boolean>,
    showRoads: Ref<boolean>,
    dataLayerRef: ShallowRef<L.FeatureGroup | null>,
    relationLayerRef: ShallowRef<L.FeatureGroup | null>,
    searchLayerRef: ShallowRef<L.FeatureGroup | null>
) {
    const tileLayerRef = shallowRef<L.TileLayer | null>(null);

    /**
     * 更新瓦片图层
     */
    const updateTileLayer = () => {
        if (!map.value) return;

        const oldLayer = tileLayerRef.value;
        const currentStyle = MAP_STYLES.find(s => s.id === activeLayer.value) || MAP_STYLES[0]!;
        const provider = MAP_PROVIDERS[currentStyle.provider];

        let url: string;
        let attribution: string = provider.attribution;
        let subdomains: string[] = [];

        // 根据地图提供商生成不同的 URL
        if (currentStyle.urlTemplate) {
            // 如果有自定义 URL 模板,直接使用
            url = currentStyle.urlTemplate;

            // 根据提供商设置 subdomains
            switch (currentStyle.provider) {
                case 'amap':
                    subdomains = ['1', '2', '3', '4'];
                    break;
                case 'osm':
                    subdomains = ['a', 'b', 'c'];
                    break;
                case 'mapbox':
                    subdomains = [];
                    break;
                default:
                    subdomains = [];
            }
        } else if (currentStyle.provider === 'google') {
            // Google Maps 需要动态生成 URL
            const styles: string[] = [];
            if (!showLabels.value) styles.push('s.e:l|p.v:off');
            if (!showRoads.value) styles.push('s.t:3|p.v:off');

            const apistyle = styles.length > 0 ? `&apistyle=${encodeURIComponent(styles.join(','))}` : '';
            const lang = targetLanguage.value || 'zh-CN';

            url = `https://mt1.google.com/vt/lyrs=${currentStyle.type}&x={x}&y={y}&z={z}&hl=${lang}${apistyle}`;
            subdomains = [];
        } else {
            // 其他提供商的默认处理
            console.warn(`未知的地图提供商: ${currentStyle.provider}, 使用 OSM 作为后备`);
            url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            subdomains = ['a', 'b', 'c'];
        }

        // 创建新图层
        const newLayer = L.tileLayer(url, {
            maxZoom: 18,
            minZoom: 3,
            attribution,
            zIndex: 0,
            subdomains,
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        });

        // 添加到地图并调整图层顺序
        newLayer.addTo(map.value);
        newLayer.bringToBack();

        // 确保数据图层在最上层
        if (relationLayerRef.value) relationLayerRef.value.bringToFront();
        if (dataLayerRef.value) dataLayerRef.value.bringToFront();
        if (searchLayerRef.value) searchLayerRef.value.bringToFront();

        // 移除旧图层(延迟以实现平滑过渡)
        if (oldLayer) {
            setTimeout(() => {
                if (map.value && map.value.hasLayer(oldLayer)) {
                    map.value.removeLayer(oldLayer);
                }
            }, 300);
        }

        tileLayerRef.value = newLayer;

        // 应用样式滤镜和过渡动画
        const newContainer = newLayer.getContainer();
        if (newContainer) {
            if (currentStyle.filter) {
                newContainer.style.filter = currentStyle.filter;
            }
            newContainer.style.opacity = '0';
            newContainer.style.transition = 'opacity 0.3s ease-in-out';
            requestAnimationFrame(() => {
                newContainer.style.opacity = '1';
            });
        }
    };

    // 监听图层相关变化
    watch([activeLayer, targetLanguage, showLabels, showRoads], updateTileLayer);

    return {
        tileLayerRef,
        updateTileLayer
    };
}
