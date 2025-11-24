import { reactive } from 'vue';

// 配置类型定义
export interface Config {
    xAxis: string;
    yAxis: string;
    zAxis: string;
    colorBy: string;
    shapeBy: string;
    planeMode: 'XY' | 'XZ' | 'YZ';
}

export function useCoordinateConfig() {
    // 配置对象，使用reactive使其具有响应性
    const config = reactive<Config>({
        xAxis: '',
        yAxis: '',
        zAxis: '',
        colorBy: '',
        shapeBy: '',
        planeMode: 'XY'
    });

    /**
     * 根据数据列自动设置默认配置
     * @param columns 所有列名
     * @param firstRow 第一行数据，用于判断数据类型
     */
    const setDefaultConfig = (columns: string[], firstRow: any) => {
        // 设置默认映射：优先选择数值型列作为坐标轴
        const numericCols = columns.filter(col => {
            if (!firstRow) return false;
            const val = parseFloat(firstRow[col] || '');
            return !isNaN(val);
        });

        if (numericCols.length >= 2) {
            config.xAxis = numericCols[0] || '';
            config.yAxis = numericCols[1] || '';
            if (numericCols.length >= 3) config.zAxis = numericCols[2] || '';
        }

        // 设置默认的分类映射：选择非数值型列作为颜色和形状映射
        const catCols = columns.filter(col => !numericCols.includes(col));
        if (catCols.length > 0) {
            config.colorBy = catCols[0] || '';
            if (catCols.length > 1) config.shapeBy = catCols[1] || '';
        }
    };

    return {
        config,
        setDefaultConfig
    };
}
