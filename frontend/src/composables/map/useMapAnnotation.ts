import { ref, type Ref } from 'vue';
import type { VisualEntity } from '@/types/entity';
import { useProjectStore } from '@/stores/projectStore';

type ProjectStore = ReturnType<typeof useProjectStore>;

/**
 * 地图标注功能 Composable
 * 负责标注表单状态管理和标注提交处理
 */
export function useMapAnnotation(projectStore: ProjectStore) {
    const isAnnotationFormOpen = ref(false);
    const tempAnnotationLoc = ref<{ lat: number, lng: number } | undefined>(undefined);
    const editingEntity = ref<VisualEntity | undefined>(undefined);

    /**
     * 打开标注表单
     */
    const openAnnotationForm = (location: { lat: number, lng: number }) => {
        tempAnnotationLoc.value = location;
        editingEntity.value = undefined;
        isAnnotationFormOpen.value = true;
    };

    /**
     * 处理标注提交
     */
    const handleAnnotationSubmit = (data: { label: string; note: string; category: string }) => {
        // Convert annotation form data to a new Item
        const newItem = {
            id: `item-${Date.now()}`,
            data: {
                name: data.label,
                description: data.note,
                category: data.category,
                // Store as GeoJSON-like structure in data for consistency with transformer
                coordinates: {
                    type: 'Point',
                    coordinates: [tempAnnotationLoc.value!.lng, tempAnnotationLoc.value!.lat]
                }
            }
        };

        projectStore.addItem(newItem);

        isAnnotationFormOpen.value = false;
        editingEntity.value = undefined;
    };

    return {
        isAnnotationFormOpen,
        tempAnnotationLoc,
        editingEntity,
        openAnnotationForm,
        handleAnnotationSubmit
    };
}
