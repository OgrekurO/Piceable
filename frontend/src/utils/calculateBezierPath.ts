import type { Color } from '@deck.gl/core';
import { interpolateColorRgba } from './interpolateColorRgba';

/**
 * 贝塞尔曲线路径计算结果
 */
export interface BezierPathResult {
    /** 路径点集合 [lng, lat][] */
    path: [number, number][];
    /** 每个点对应的颜色 (用于渐变) */
    colors: Color[];
    /** 控制点坐标 [lng, lat] */
    controlPoint: [number, number];
}

/**
 * 计算二次贝塞尔曲线路径
 * 
 * 用于在地图上绘制平滑的弧线,支持自定义控制点或自动计算
 * 
 * @param start - 起点坐标 [lng, lat]
 * @param end - 终点坐标 [lng, lat]
 * @param startColor - 起点颜色 (RGBA)
 * @param endColor - 终点颜色 (RGBA)
 * @param customControlPoint - 可选的自定义控制点 [lng, lat]
 * @param steps - 曲线分段数,默认 30 (越大越平滑但性能开销越大)
 * @returns 贝塞尔曲线路径数据
 * 
 * @example
 * const result = calculateBezierPath(
 *   [120.0, 30.0],
 *   [121.0, 31.0],
 *   [255, 0, 0, 255],
 *   [0, 0, 255, 255]
 * );
 * // result.path: 包含 31 个点的路径
 * // result.colors: 从红色渐变到蓝色的 31 个颜色
 */
export function calculateBezierPath(
    start: [number, number],
    end: [number, number],
    startColor: Color,
    endColor: Color,
    customControlPoint?: [number, number],
    steps: number = 30
): BezierPathResult {
    const points: [number, number][] = [];
    const colors: Color[] = [];

    let controlX: number;
    let controlY: number;

    if (customControlPoint) {
        // 使用用户拖拽的自定义控制点
        [controlX, controlY] = customControlPoint;
    } else {
        // 默认算法：计算中点并垂直偏移
        const midX = (start[0] + end[0]) / 2;
        const midY = (start[1] + end[1]) / 2;
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];

        // 偏移量：距离的 0.2 倍,垂直于连线方向
        const offset = 0.2;
        controlX = midX - dy * offset;
        controlY = midY + dx * offset;
    }

    // 生成贝塞尔曲线上的点
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;

        // 二次贝塞尔公式: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
        const x = (1 - t) * (1 - t) * start[0] +
            2 * (1 - t) * t * controlX +
            t * t * end[0];
        const y = (1 - t) * (1 - t) * start[1] +
            2 * (1 - t) * t * controlY +
            t * t * end[1];

        points.push([x, y]);

        // 计算当前点的颜色 (实现渐变)
        colors.push(interpolateColorRgba(startColor, endColor, t));
    }

    return {
        path: points,
        colors,
        controlPoint: [controlX, controlY]
    };
}
