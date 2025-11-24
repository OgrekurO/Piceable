import type { ProjectSchema } from './schema';

// 基础实体：对应后端的 Item
export interface BaseItem {
    id: string;
    project_id?: number;
    data: Record<string, any>; // 原始 JSON 数据
    created_at?: string;
    updated_at?: string;
}

// 空间属性
export interface GeoData {
    lat: number;
    lng: number;
    address?: string;
    wkt?: string; // 复杂多边形支持
}

// 时间属性
export interface TimeData {
    start: Date;
    end?: Date;
}

// 关系属性
export interface LinkData {
    targetId: string;
    relationType: string;
    label?: string; // 缓存的目标名称
}

// 视图适配器 (View Adapter) - 专门喂给组件使用
export interface VisualEntity extends BaseItem {
    // 核心属性
    primaryLabel: string;   // 对应表格第一列 / 图谱节点文字

    // 视图特定属性 (可选，根据 Schema 解析)
    geo?: GeoData;
    time?: TimeData;
    links?: LinkData[];

    // 原始 Schema 引用 (方便组件反查)
    _schema?: ProjectSchema;
}
