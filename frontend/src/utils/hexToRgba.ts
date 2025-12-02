import type { Color } from '@deck.gl/core';

/**
 * 将 Hex 颜色字符串转换为 RGBA 数组
 * 
 * @param hex - Hex 颜色字符串 (例如: '#FF5733')
 * @param alpha - 透明度 (0-255), 默认 255 (不透明)
 * @returns RGBA 颜色数组 [r, g, b, a]
 * 
 * @example
 * hexToRgba('#FF5733', 200) // [255, 87, 51, 200]
 * hexToRgba('invalid') // [153, 153, 153, 255] (默认灰色)
 */
export function hexToRgba(hex: string, alpha: number = 255): Color {
    if (!hex || !hex.startsWith('#')) {
        return [153, 153, 153, alpha]; // 默认灰色
    }

    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);

    return [r, g, b, alpha];
}
