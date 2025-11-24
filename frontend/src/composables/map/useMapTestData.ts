import { useProjectStore } from '@/stores/projectStore';
import { parseCSV } from '@/core/services/fileUploadService';

type ProjectStore = ReturnType<typeof useProjectStore>;

/**
 * 地图测试数据加载 Composable
 * 负责加载和转换 CSV 测试数据
 */
export function useMapTestData(projectStore: ProjectStore) {
    /**
     * 加载测试数据
     */
    const loadTestData = async () => {
        try {
            const response = await fetch('/datas.csv');
            const csvContent = await response.text();
            const parsedData = parseCSV(csvContent);

            // Convert legacy CSV data to BaseItems
            const items = parsedData.map(record => ({
                id: record.id,
                data: {
                    ...record,
                    // Ensure coordinates are in the expected format for the transformer if needed
                    // But transformer also handles legacy lat/lng in data, so this might be fine
                }
            }));

            // Define a simple schema for CSV data
            const schema = {
                fields: [
                    { key: 'label', label: 'Label', type: 'text', is_primary: true },
                    { key: 'lat', label: 'Latitude', type: 'geo_point' }, // Transformer handles lat/lng in data
                    { key: 'lng', label: 'Longitude', type: 'geo_point' }
                ]
            };

            projectStore.loadItems(items, schema as any);
        } catch (error) {
            console.error('[useMapTestData] 加载测试数据失败:', error);
        }
    };

    return {
        loadTestData
    };
}
