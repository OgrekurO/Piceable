// src/core/models/eagle.ts

// Eagle 原始文件夹
export interface EagleFolder {
    id: string;
    name: string;
    children?: EagleFolder[];
}

// Eagle 原始项目
export interface EagleItem {
    id: string;
    name: string;
    folders: string[];
    tags: string[];
    annotation: string;
    url: string;
    lastModified: number;
    thumbnail?: string;
}

// 库信息
export interface LibraryInfo {
    id: string;
    name: string;
    path: string;
    folders: EagleFolder[];
    items: EagleItem[];
    itemsCount: number;
}

// 同步状态
export interface ImageSyncStatus {
    id: number;
    eagleId: string;
    lastSyncTime: string;
    userId: number;
    status: 'pending' | 'synced' | 'error';
}

// ⚠️ 看起来像旧的属性结构？如果是 Eagle 专用的留这，如果是通用的建议废弃用 Schema
export interface ImageAttributeValue {
    id: number;
    eagleId: string;
    attributeId: number;
    valueJson: string;
}
