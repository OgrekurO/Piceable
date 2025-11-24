// ==================== 地图提供商配置 ====================

/**
 * 地图提供商类型
 */
export type MapProvider = 'google' | 'amap' | 'osm' | 'mapbox';

/**
 * 地图提供商元数据
 */
export interface MapProviderMeta {
    id: MapProvider;
    name: string;
    nameEn: string;
    available: boolean; // 在当前地区是否可用
    priority: number; // 优先级,数字越小优先级越高
    features: {
        supportsLabels: boolean; // 是否支持标签控制
        supportsRoads: boolean; // 是否支持道路控制
        supportsLanguage: boolean; // 是否支持语言切换
        supportsCustomStyle: boolean; // 是否支持自定义样式
    };
    attribution: string;
}

/**
 * 地图样式配置
 */
export interface MapStyle {
    id: string;
    name: string;
    provider: MapProvider;
    type: string;
    filter: string;
    previewColor: string;
    urlTemplate?: string; // 自定义 URL 模板
}

// ==================== 提供商注册表 ====================

export const MAP_PROVIDERS: Record<MapProvider, MapProviderMeta> = {
    google: {
        id: 'google',
        name: 'Google 地图',
        nameEn: 'Google Maps',
        available: true, // ✅ 改为可用(优先使用)
        priority: 1, // 最高优先级
        features: {
            supportsLabels: true,
            supportsRoads: true,
            supportsLanguage: true,
            supportsCustomStyle: true
        },
        attribution: '&copy; Google Maps'
    },
    amap: {
        id: 'amap',
        name: '高德地图',
        nameEn: 'Amap',
        available: true,
        priority: 2, // 次选
        features: {
            supportsLabels: false, // 
            supportsRoads: false,
            supportsLanguage: false, // 高德固定中文
            supportsCustomStyle: false
        },
        attribution: '&copy; <a href="https://www.amap.com/">高德地图</a>'
    },
    osm: {
        id: 'osm',
        name: 'OpenStreetMap',
        nameEn: 'OpenStreetMap',
        available: true,
        priority: 3,
        features: {
            supportsLabels: false,
            supportsRoads: false,
            supportsLanguage: false,
            supportsCustomStyle: false
        },
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    mapbox: {
        id: 'mapbox',
        name: 'Mapbox',
        nameEn: 'Mapbox',
        available: false, // 需要 API Key
        priority: 4,
        features: {
            supportsLabels: true,
            supportsRoads: true,
            supportsLanguage: true,
            supportsCustomStyle: true
        },
        attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
    }
};

// ==================== 地图样式定义 ====================

export const MAP_STYLES: MapStyle[] = [
    // ========== Google Maps 样式 ==========
    {
        id: 'google-streets',
        name: '标准',
        provider: 'google',
        type: 'm',
        filter: '',
        previewColor: '#f8f9fa',
    },
    {
        id: 'google-satellite',
        name: '卫星',
        provider: 'google',
        type: 'y',
        filter: '',
        previewColor: '#0f172a',
    },
    {
        id: 'google-terrain',
        name: '地形',
        provider: 'google',
        type: 'p',
        filter: '',
        previewColor: '#ecfccb',
    },
    {
        id: 'google-light',
        name: '淡色',
        provider: 'google',
        type: 'm',
        filter: 'grayscale(100%) contrast(90%) brightness(105%)',
        previewColor: '#ffffff',
    },
    {
        id: 'google-dark',
        name: '深色',
        provider: 'google',
        type: 'm',
        filter: 'invert(100%) hue-rotate(180deg) brightness(90%) contrast(90%) grayscale(20%)',
        previewColor: '#171717',
    },

    // ========== 高德地图样式 ==========
    {
        id: 'amap-streets',
        name: '标准道路',
        provider: 'amap',
        type: 'vec',
        filter: '',
        previewColor: '#f8f9fa',
        urlTemplate: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}&ltype=5'
    },
    {
        id: 'amap-satellite',
        name: '卫星影像',
        provider: 'amap',
        type: 'img',
        filter: '',
        previewColor: '#0f172a',
        urlTemplate: 'https://webst0{s}.is.autonavi.com/appmaptile?size=1&style=6&x={x}&y={y}&z={z}'
    },

    // ========== OpenStreetMap 样式 ==========
    {
        id: 'osm-standard',
        name: '标准',
        provider: 'osm',
        type: 'standard',
        filter: '',
        previewColor: '#f8f9fa',
        urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    }
];

// ==================== 语言配置 ====================

export const LANGUAGES = [
    { code: 'zh-CN', label: '中文 (简体)' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'fr', label: 'Français' },
];

// ==================== 工具函数 ====================

/**
 * 获取可用的地图提供商
 */
export function getAvailableProviders(): MapProviderMeta[] {
    return Object.values(MAP_PROVIDERS)
        .filter(p => p.available)
        .sort((a, b) => a.priority - b.priority);
}

/**
 * 获取指定提供商的样式
 */
export function getProviderStyles(provider: MapProvider): MapStyle[] {
    return MAP_STYLES.filter(s => s.provider === provider);
}

/**
 * 获取所有可用的样式
 */
export function getAvailableStyles(): MapStyle[] {
    const availableProviders = getAvailableProviders().map(p => p.id);
    return MAP_STYLES.filter(s => availableProviders.includes(s.provider));
}

/**
 * 获取默认样式
 */
export function getDefaultStyle(): string {
    const availableStyles = getAvailableStyles();
    return availableStyles[0]?.id || 'google-streets';
}

/**
 * 根据样式ID获取提供商信息
 */
export function getProviderByStyleId(styleId: string): MapProviderMeta | undefined {
    const style = MAP_STYLES.find(s => s.id === styleId);
    return style ? MAP_PROVIDERS[style.provider] : undefined;
}

/**
 * 检查当前样式是否支持某个特性
 */
export function supportsFeature(styleId: string, feature: keyof MapProviderMeta['features']): boolean {
    const provider = getProviderByStyleId(styleId);
    return provider?.features[feature] || false;
}
