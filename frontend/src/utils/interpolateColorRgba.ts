import type { Color } from '@deck.gl/core';

/**
 * 在两个 RGBA 颜色之间进行线性插值
 * 
 * @param color1 - 起始颜色 [r, g, b, a]
 * @param color2 - 结束颜色 [r, g, b, a]
 * @param factor - 插值因子 (0-1), 0 返回 color1, 1 返回 color2
 * @returns 插值后的 RGBA 颜色数组
 * 
 * @example
 * interpolateColorRgba([255, 0, 0, 255], [0, 0, 255, 255], 0.5)
 * // 返回: [128, 0, 128, 255] (紫色)
 */
export function interpolateColorRgba(
    color1: Color,
    color2: Color,
    factor: number
): Color {
    return [
        Math.round((color1[0] ?? 0) + ((color2[0] ?? 0) - (color1[0] ?? 0)) * factor),
        Math.round((color1[1] ?? 0) + ((color2[1] ?? 0) - (color1[1] ?? 0)) * factor),
        Math.round((color1[2] ?? 0) + ((color2[2] ?? 0) - (color1[2] ?? 0)) * factor),
        Math.round((color1[3] ?? 255) + ((color2[3] ?? 255) - (color1[3] ?? 255)) * factor)
    ];
}
