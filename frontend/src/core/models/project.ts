// src/core/models/project.ts
import type { ProjectSchema } from './schema';

// 表格 (子集)
export interface Table {
    id: number;
    project_id: number;
    name: string;
    description?: string;
    schema?: ProjectSchema; // 每个表有自己的 Schema
    created_at: string;
    updated_at: string;
}

// 项目 (顶层容器)
export interface Project {
    id: number;
    name: string;
    description?: string;
    source_type?: 'upload' | 'eagle' | 'manual';
    source_metadata?: any;
    // 兼容旧逻辑，未来建议只用 Table 的 schema
    schema?: ProjectSchema;
    items_count: number;
    created_at: string;
    last_modified: string;
    tables?: Table[];
}
