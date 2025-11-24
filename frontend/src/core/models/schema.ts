// src/core/models/schema.ts

// 1. 字段类型枚举 (新增 RICH_TEXT, JSON)
export enum FieldType {
    TEXT = 'text',
    RICH_TEXT = 'rich_text', // 富文本/Markdown
    NUMBER = 'number',
    DATE = 'date',
    DATE_RANGE = 'date_range',
    GEO_POINT = 'geo_point',
    RELATION = 'relation',
    SELECT = 'select',
    MULTI_SELECT = 'multi_select',
    IMAGE = 'image',
    URL = 'url',
    JSON = 'json' // 用于存储复杂元数据
}

// 2. 选项配置 (支持颜色)
export interface SelectOption {
    id: string;
    label: string;
    color: string; // HEX 或 Preset Name
}

// 3. 关系配置
export interface RelationConfig {
    target_table_id: number;
    relation_type: '1:1' | '1:N' | 'N:N';
}

// 4. 数字配置 (格式化)
export interface NumberConfig {
    precision?: number; // 小数位
    unit?: string;      // 单位 (kg, m, $)
}

// 5. 核心字段定义
export interface FieldDefinition {
    key: string;        // 数据库存储的键 (e.g., "col_u9a2")
    label: string;      // 用户看到的列名 (e.g., "价格")
    type: FieldType;

    // --- 行为属性 ---
    is_primary?: boolean; // 是否为主键/标题列
    required?: boolean;
    unique?: boolean;
    read_only?: boolean;
    default_value?: any;

    // --- 类型特定配置 ---
    options?: SelectOption[];       // Select/MultiSelect 用
    relation_config?: RelationConfig; // Relation 用
    number_config?: NumberConfig;   // Number 用

    // --- UI 表现属性 ---
    width?: number;     // 表格列宽
    hidden?: boolean;   // 默认隐藏
    description?: string; // 字段说明
}

// 6. 视图配置 (增强版)
export interface ViewSettings {
    // 表格视图配置
    table?: {
        visible_fields?: string[];
        sort?: { field: string; order: 'asc' | 'desc' };
    };
    // 地图视图配置
    map?: {
        lat_field: string;
        lng_field: string;
        label_field?: string; // Marker 上的文字
    };
    // 时间轴视图配置
    timeline?: {
        start_field: string;
        end_field?: string;
        color_field?: string; // 条状图颜色
    };
    // 图谱视图配置
    graph?: {
        source_field?: string; // 如果是基于属性生成的图
        target_field?: string;
        node_color_field?: string;
        node_size_field?: string;
    };
}

// 7. 完整的 Schema
export interface ProjectSchema {
    fields: FieldDefinition[];
    view_settings?: ViewSettings;
    version?: number; // 加上版本号，方便未来做 Schema 迁移
}