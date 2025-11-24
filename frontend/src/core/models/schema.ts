export enum FieldType {
    TEXT = 'text',
    NUMBER = 'number',
    DATE = 'date',
    DATE_RANGE = 'date_range',
    GEO_POINT = 'geo_point',
    RELATION = 'relation',
    SELECT = 'select',
    MULTI_SELECT = 'multi_select',
    IMAGE = 'image',
    URL = 'url'
}

export interface FieldDefinition {
    key: string;
    label: string;
    type: FieldType;
    options?: string[]; // For select/multi_select
    required?: boolean;
}

export interface ViewSettings {
    map?: {
        lat_field: string;
        lng_field: string;
    };
    timeline?: {
        start_field: string;
        end_field: string;
    };
}

export interface ProjectSchema {
    fields: FieldDefinition[];
    view_settings?: Record<string, any>;
}

export interface Table {
    id: number;
    project_id: number;
    name: string;
    description?: string;
    schema?: ProjectSchema;
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: number;
    name: string;
    description?: string;
    source_type?: 'upload' | 'eagle' | 'manual';
    source_metadata?: any;
    // schema is now optional or deprecated on Project, but we keep it for compatibility
    schema?: ProjectSchema;
    items_count: number;
    created_at: string;
    last_modified: string;
    tables?: Table[]; // New field
}
