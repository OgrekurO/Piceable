import { type Ref, computed } from 'vue';
import type { Color } from '@deck.gl/core';
import type { VisualEntity, LinkData as BaseLinkData } from '@/types/entity';
import { hexToRgba } from '@/utils/hexToRgba';
import { calculateBezierPath } from '@/utils/calculateBezierPath';

/**
 * 扩展的连线数据接口 (添加自定义控制点支持)
 */
export interface LinkData extends BaseLinkData {
    customControlPoint?: [number, number];
}

/**
 * 弧线数据接口 (用于 Deck.gl PathLayer)
 */
export interface ArcData {
    path: [number, number][];
    colors: Color[];
    width: number;
    originalLink: LinkData;
    sourceId: string;
}

/**
 * 节点数据接口 (用于 Deck.gl ScatterplotLayer)
 */
export interface NodeData {
    id: string;
    position: [number, number];
    color: Color;
    radius: number;
    entity: VisualEntity;
}

/**
 * 地图数据转换器
 * 
 * 将业务数据 (VisualEntity[]) 转换为 Deck.gl 图层所需的视图数据
 */
export function useMapDataTransformer(
    entities: Ref<VisualEntity[]>,
    filteredEntities: Ref<VisualEntity[]>,
    groupByColumn: Ref<string | null | undefined>,
    categoryColors: Ref<Record<string, string>>,
    hoveredNodeId: Ref<string | null>
) {
    const defaultColor = '#0077b6';
    const defaultArcColor = '#999999';

    /**
     * 构建节点数据
     */
    const buildNodeData = (): NodeData[] => {
        const nodes: NodeData[] = [];

        filteredEntities.value.forEach(entity => {
            if (!entity.geo || isNaN(entity.geo.lat) || isNaN(entity.geo.lng)) return;

            // 根据分组列获取颜色
            let colorHex = defaultColor;
            if (groupByColumn.value && categoryColors.value) {
                const val = String(entity.data[groupByColumn.value] || 'Unknown');
                colorHex = categoryColors.value[val] || defaultColor;
            }

            nodes.push({
                id: entity.id,
                position: [entity.geo.lng, entity.geo.lat], // Deck.gl 使用 [lng, lat]
                color: hexToRgba(colorHex, 255),
                radius: hoveredNodeId.value === entity.id ? 8 : 6, // 悬停时放大
                entity
            });
        });

        return nodes;
    };

    /**
     * 构建弧线数据
     */
    const buildArcData = (): ArcData[] => {
        const arcs: ArcData[] = [];

        // 构建实体映射表 (用于快速查找目标节点)
        const entityMap = new Map<string, { entity: VisualEntity; color: string }>();
        entities.value.forEach(e => {
            let color = defaultArcColor;
            if (groupByColumn.value && categoryColors.value) {
                const val = String(e.data[groupByColumn.value] || 'Unknown');
                color = categoryColors.value[val] || defaultArcColor;
            }
            entityMap.set(e.id, { entity: e, color });
        });

        // 遍历所有实体,构建连线
        filteredEntities.value.forEach(entity => {
            if (!entity.geo || !entity.links) return;

            const startData = entityMap.get(entity.id);
            if (!startData) return;

            entity.links.forEach(baseLink => {
                // 类型断言: 将 BaseLinkData 转换为扩展的 LinkData
                const link = baseLink as LinkData;

                const targetData = entityMap.get(link.targetId);
                if (!targetData || !targetData.entity.geo) return;

                const startPos: [number, number] = [entity.geo!.lng, entity.geo!.lat];
                const endPos: [number, number] = [targetData.entity.geo.lng, targetData.entity.geo.lat];

                // 检查距离是否为 0 (避免除零错误)
                const dist = Math.sqrt(
                    Math.pow(endPos[0] - startPos[0], 2) +
                    Math.pow(endPos[1] - startPos[1], 2)
                );
                if (dist === 0) return;

                // 计算贝塞尔路径 + 渐变色
                const { path, colors } = calculateBezierPath(
                    startPos,
                    endPos,
                    hexToRgba(startData.color, 200),
                    hexToRgba(targetData.color, 200),
                    link.customControlPoint
                );

                arcs.push({
                    path,
                    colors,
                    width: Math.max(1, 4 - dist * 10), // 动态宽度
                    originalLink: link,
                    sourceId: entity.id
                });
            });
        });

        return arcs;
    };

    return {
        buildNodeData,
        buildArcData
    };
}
