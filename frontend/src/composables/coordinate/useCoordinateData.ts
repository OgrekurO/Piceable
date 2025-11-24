import { ref } from 'vue';
import * as d3 from 'd3';

// 数据点类型定义
export interface DataPoint {
    [key: string]: any;
}

export function useCoordinateData() {
    const data = ref<DataPoint[]>([]); // 存储加载的数据
    const columns = ref<string[]>([]); // 存储数据的列名
    const hoveredNode = ref<DataPoint | null>(null); // 存储当前悬停的节点

    /**
     * 加载数据函数
     * 从/People.csv文件加载数据并进行初步处理
     */
    const loadData = async (onDataLoaded?: (cols: string[], firstRow: any) => void) => {
        try {
            const response = await fetch('/People.csv');
            const text = await response.text();
            const parsedData = d3.csvParse(text);

            if (parsedData.length > 0) {
                data.value = parsedData;
                columns.value = parsedData.columns;

                if (onDataLoaded) {
                    onDataLoaded(parsedData.columns, parsedData[0]);
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    /**
     * 节点悬停事件处理函数
     * @param node - 悬停的节点数据，如果未悬停则为null
     */
    const onNodeHover = (node: DataPoint | null) => {
        hoveredNode.value = node;
    };

    return {
        data,
        columns,
        hoveredNode,
        loadData,
        onNodeHover
    };
}
