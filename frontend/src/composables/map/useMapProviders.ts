import { computed, type ComputedRef, type Ref } from 'vue';
import {
    MAP_PROVIDERS,
    MAP_STYLES,
    getAvailableProviders,
    getProviderStyles,
    getAvailableStyles,
    getProviderByStyleId,
    supportsFeature,
    type MapProvider,
    type MapProviderMeta,
    type MapStyle
} from '@/core/constants/map';

/**
 * 地图提供商管理 Composable
 * 提供地图源的智能管理和特性检测
 */
export function useMapProviders(currentStyleId: Ref<string> | ComputedRef<string>) {
    /**
     * 所有可用的地图提供商
     */
    const availableProviders = computed<MapProviderMeta[]>(() => {
        return getAvailableProviders();
    });

    /**
     * 所有可用的地图样式
     */
    const availableStyles = computed<MapStyle[]>(() => {
        return getAvailableStyles();
    });

    /**
     * 按提供商分组的样式
     */
    const groupedStyles = computed<Record<MapProvider, MapStyle[]>>(() => {
        const groups: Partial<Record<MapProvider, MapStyle[]>> = {};

        availableProviders.value.forEach(provider => {
            groups[provider.id] = getProviderStyles(provider.id);
        });

        return groups as Record<MapProvider, MapStyle[]>;
    });

    /**
     * 当前使用的提供商
     */
    const currentProvider = computed<MapProviderMeta | undefined>(() => {
        return getProviderByStyleId(currentStyleId.value);
    });

    /**
     * 当前提供商是否支持标签控制
     */
    const supportsLabels = computed<boolean>(() => {
        return supportsFeature(currentStyleId.value, 'supportsLabels');
    });

    /**
     * 当前提供商是否支持道路控制
     */
    const supportsRoads = computed<boolean>(() => {
        return supportsFeature(currentStyleId.value, 'supportsRoads');
    });

    /**
     * 当前提供商是否支持语言切换
     */
    const supportsLanguage = computed<boolean>(() => {
        return supportsFeature(currentStyleId.value, 'supportsLanguage');
    });

    /**
     * 当前提供商是否支持自定义样式
     */
    const supportsCustomStyle = computed<boolean>(() => {
        return supportsFeature(currentStyleId.value, 'supportsCustomStyle');
    });

    /**
     * 获取提供商的显示名称
     */
    const getProviderName = (provider: MapProvider, lang: 'zh' | 'en' = 'zh'): string => {
        const meta = MAP_PROVIDERS[provider];
        return lang === 'zh' ? meta.name : meta.nameEn;
    };

    /**
     * 检查提供商是否可用
     */
    const isProviderAvailable = (provider: MapProvider): boolean => {
        return MAP_PROVIDERS[provider]?.available || false;
    };

    return {
        // 提供商信息
        availableProviders,
        currentProvider,

        // 样式信息
        availableStyles,
        groupedStyles,

        // 特性检测
        supportsLabels,
        supportsRoads,
        supportsLanguage,
        supportsCustomStyle,

        // 工具函数
        getProviderName,
        isProviderAvailable,
        supportsFeature: (feature: keyof MapProviderMeta['features']) =>
            supportsFeature(currentStyleId.value, feature)
    };
}
