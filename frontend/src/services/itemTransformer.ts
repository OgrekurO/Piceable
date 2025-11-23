import type { BaseItem, VisualEntity, GeoData, TimeData, LinkData } from '../types/entity';
import { type ProjectSchema, FieldType } from '../types/schema';

export class ItemTransformer {
    /**
     * 将原始 Item 转换为 VisualEntity
     */
    static transform(item: BaseItem, schema: ProjectSchema): VisualEntity {
        const entity: VisualEntity = {
            ...item,
            primaryLabel: '未命名',
            _schema: schema
        };

        // 如果没有 schema 或 fields，直接返回基础实体
        if (!schema || !schema.fields) {
            return entity;
        }

        schema.fields.forEach(field => {
            const value = item.data[field.key];

            // 跳过空值
            if (value === undefined || value === null || value === '') {
                return;
            }

            // 1. 处理主标签 (Primary Label)
            if (field.is_primary) {
                entity.primaryLabel = String(value);
            }

            // 2. 处理地理位置 (Geo Point)
            if (field.type === FieldType.GEO_POINT) {
                // 支持 GeoJSON 格式: { type: 'Point', coordinates: [lng, lat] }
                if (value.type === 'Point' && Array.isArray(value.coordinates) && value.coordinates.length >= 2) {
                    entity.geo = {
                        lng: value.coordinates[0],
                        lat: value.coordinates[1],
                        address: value.address
                    };
                }
                // 兼容旧格式: { lat: 123, lng: 456 }
                else if (typeof value.lat === 'number' && typeof value.lng === 'number') {
                    entity.geo = {
                        lat: value.lat,
                        lng: value.lng,
                        address: value.address
                    };
                }
            }

            // 3. 处理时间 (Date / Date Range)
            if (field.type === FieldType.DATE || field.type === FieldType.DATE_RANGE) {
                // 标准格式: { start: 'ISO', end: 'ISO' }
                if (typeof value === 'object' && value.start) {
                    entity.time = {
                        start: new Date(value.start),
                        end: value.end ? new Date(value.end) : undefined
                    };
                }
                // 简单字符串格式
                else if (typeof value === 'string') {
                    entity.time = {
                        start: new Date(value)
                    };
                }
            }

            // 4. 处理关系 (Relation)
            if (field.type === FieldType.RELATION) {
                if (Array.isArray(value)) {
                    const links: LinkData[] = value.map((v: any) => ({
                        targetId: v.id,
                        relationType: field.key,
                        label: v.label
                    }));

                    if (!entity.links) {
                        entity.links = [];
                    }
                    entity.links.push(...links);
                }
            }
        });

        // 如果没有找到 primary label，尝试使用 name 或 title 字段
        if (entity.primaryLabel === '未命名') {
            if (item.data.name) entity.primaryLabel = item.data.name;
            else if (item.data.title) entity.primaryLabel = item.data.title;
        }

        return entity;
    }

    /**
     * 批量转换
     */
    static transformList(items: BaseItem[], schema: ProjectSchema): VisualEntity[] {
        return items.map(item => this.transform(item, schema));
    }
}
