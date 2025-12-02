import { ref, computed, type Ref, type ShallowRef } from 'vue';

/**
 * 缩放级别配置
 */
export interface ZoomLevelConfig {
    /** 最小缩放级别 (显示聚合) */
    minZoom: number;
    /** 开始显示连线的缩放级别 */
    linksVisibleZoom: number;
    /** 开始显示详细信息的缩放级别 */
    detailsVisibleZoom: number;
    /** 节点大小配置 */
    nodeRadius: {
        far: number;    // 远距离
        medium: number; // 中距离
        near: number;   // 近距离
    };
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: ZoomLevelConfig = {
    minZoom: 3,
    linksVisibleZoom: 10,
    detailsVisibleZoom: 12,
    nodeRadius: {
        far: 3,
        medium: 6,
        near: 8
    }
};

/**
 * 地图缩放级别管理
 * 
 * 根据地图缩放级别动态调整渲染策略
 */
export function useMapZoomLevel(
    map: ShallowRef<L.Map | null>,
    config: Partial<ZoomLevelConfig> = {}
) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    // 当前缩放级别
    const currentZoom = ref(10);

    /**
     * 更新缩放级别
     */
    const updateZoom = () => {
        if (map.value) {
            currentZoom.value = map.value.getZoom();
        }
    };

    /**
     * 是否应该渲染连线
     */
    const shouldRenderLinks = computed(() => {
        return currentZoom.value >= finalConfig.linksVisibleZoom;
    });

    /**
     * 是否应该显示详细信息
     */
    const shouldShowDetails = computed(() => {
        return currentZoom.value >= finalConfig.detailsVisibleZoom;
    });

    /**
     * 是否应该使用聚合模式
     */
    const shouldUseAggregation = computed(() => {
        return currentZoom.value < finalConfig.linksVisibleZoom;
    });

    /**
     * 获取当前缩放级别对应的节点半径
     */
    const getNodeRadius = computed(() => {
        const zoom = currentZoom.value;
        if (zoom < 8) return finalConfig.nodeRadius.far;
        if (zoom < 12) return finalConfig.nodeRadius.medium;
        return finalConfig.nodeRadius.near;
    });

    /**
     * 获取节点大小的像素范围
     */
    const getNodePixelRange = computed(() => {
        const zoom = currentZoom.value;
        if (zoom < 8) {
            return { min: 4, max: 12 };   // 远距离: 小点
        } else if (zoom < 12) {
            return { min: 8, max: 12 };  // 中距离: 中等
        } else {
            return { min: 12, max: 30 };  // 近距离: 大点
        }
    });

    /**
     * 获取连线宽度范围
     */
    const getLinkWidthRange = computed(() => {
        const zoom = currentZoom.value;
        if (zoom < 10) {
            return { min: 0, max: 0 };   // 不显示
        } else if (zoom < 12) {
            return { min: 1, max: 3 };   // 细线
        } else {
            return { min: 1, max: 6 };   // 正常线
        }
    });

    return {
        currentZoom,
        updateZoom,
        shouldRenderLinks,
        shouldShowDetails,
        shouldUseAggregation,
        getNodeRadius,
        getNodePixelRange,
        getLinkWidthRange
    };
}
