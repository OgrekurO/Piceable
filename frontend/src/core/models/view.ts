import type { VisualEntity } from './entity';

// src/core/models/view.ts 定义如何看这些数据，比如书签、搜索结果

// 视图书签 (保存的是相机的状态，而不是数据本身)
export interface Bookmark {
    id: string;
    name: string;
    view: {
        center: [number, number];
        zoom: number;
        layer: string;
    };
    timestamp: number;
}

export interface SearchResult<T = VisualEntity> {
    record: T; // 泛型，通常是 VisualEntity
    score: number;
}
