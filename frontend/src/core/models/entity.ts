import type { ProjectSchema, GeocodingMetadata } from './schema';

// 1. 基础存储单元 (对应数据库的一行)
export interface BaseItem {
    id: string;
    project_id?: number;
    data: Record<string, any>; // 动态数据
    created_at?: string;
    updated_at?: string;
}

// 2. 属性值对象 (为了 VisualEntity 服务)
export interface GeoData {
    lat: number;
    lng: number;
    address?: string;
    wkt?: string;
}

export interface TimeData {
    start: Date;
    end?: Date;
}

export interface LinkData {
    targetId: string;
    relationType: string;
    label?: string;
    direction?: string;
}

// 3. 可视化实体 (前端组件真正使用的对象)
export interface VisualEntity extends BaseItem {
    primaryLabel: string;   // 标题
    geo?: GeoData;          // 地图用
    time?: TimeData;        // 时间轴用
    links?: LinkData[];     // 图谱用
    geocoding_metadata?: GeocodingMetadata; // 地理编码元数据
    _schema?: ProjectSchema; // 方便反查定义
}
