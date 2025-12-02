import { shallowRef, type Ref, type ShallowRef } from 'vue';
import L from 'leaflet';
import type { VisualEntity } from '@/types/entity';
import { calculateBezierPath } from '@/utils/calculateBezierPath';
import type { ArcData } from './useMapDataTransformer';

/**
 * 连线编辑器
 * 
 * 负责处理连线的交互编辑功能,包括:
 * - 显示/隐藏编辑手柄
 * - 拖拽手柄调整弧度
 * - 管理编辑状态
 */
export function useLinkEditor(
    map: ShallowRef<L.Map | null>,
    entities: Ref<VisualEntity[]>,
    onUpdate: () => void
) {
    // 当前选中的弧线
    const selectedArc = shallowRef<{ sourceId: string; targetId: string } | null>(null);

    // 编辑手柄 Marker
    const editHandleMarker = shallowRef<L.Marker | null>(null);

    /**
     * 更新编辑手柄位置
     * 
     * 在地图上显示一个可拖拽的手柄,用于调整贝塞尔曲线的控制点
     */
    const updateEditHandle = (arcData: ArcData) => {
        if (!map.value) return;

        // 清除旧的手柄
        if (editHandleMarker.value) {
            editHandleMarker.value.remove();
            editHandleMarker.value = null;
        }

        // 查找起点和终点节点
        const startNode = entities.value.find(e => e.id === arcData.sourceId);
        const targetNode = entities.value.find(e => e.id === arcData.originalLink.targetId);

        if (!startNode?.geo || !targetNode?.geo) return;

        // 重新计算控制点位置
        const { controlPoint } = calculateBezierPath(
            [startNode.geo.lng, startNode.geo.lat],
            [targetNode.geo.lng, targetNode.geo.lat],
            [0, 0, 0, 0], // 颜色不重要,只需要控制点
            [0, 0, 0, 0],
            arcData.originalLink.customControlPoint
        );

        // 创建可拖拽的 Marker
        const marker = L.marker([controlPoint[1], controlPoint[0]], {
            draggable: true,
            icon: L.divIcon({
                className: 'bezier-handle',
                html: '<div style="width: 10px; height: 10px; background: #fff; border: 2px solid #333; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); cursor: move;"></div>',
                iconSize: [14, 14],
                iconAnchor: [7, 7]
            })
        });

        // 监听拖拽事件
        marker.on('drag', (e) => {
            const latlng = e.target.getLatLng();
            // 直接修改原始数据的控制点
            arcData.originalLink.customControlPoint = [latlng.lng, latlng.lat];
            // 触发重绘
            onUpdate();
        });

        marker.addTo(map.value);
        editHandleMarker.value = marker;
    };

    /**
     * 清除编辑模式
     * 
     * 移除编辑手柄并清空选中状态
     */
    const clearEditMode = () => {
        if (editHandleMarker.value) {
            editHandleMarker.value.remove();
            editHandleMarker.value = null;
        }
        selectedArc.value = null;
    };

    return {
        selectedArc,
        editHandleMarker,
        updateEditHandle,
        clearEditMode
    };
}
