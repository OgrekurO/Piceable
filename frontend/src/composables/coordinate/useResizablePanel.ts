import { ref, onUnmounted } from 'vue';

export function useResizablePanel(initialHeightRatio = 0.5) {
    // 可调整高度的逻辑
    const topHeight = ref(window.innerHeight * initialHeightRatio); // 默认高度
    let isResizing = false;
    let startY = 0;
    let startHeight = 0;

    /**
     * 开始调整大小事件处理函数
     * @param e - 鼠标事件
     */
    const startResize = (e: MouseEvent) => {
        isResizing = true;
        startY = e.clientY;
        startHeight = topHeight.value;
        e.preventDefault();

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    // 添加鼠标移动和松开事件监听器
    const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizing) return;

        // 计算鼠标移动的距离
        const deltaY = moveEvent.clientY - startY;
        const newHeight = startHeight + deltaY;

        // 限制最小和最大高度（20% - 80%）
        const minHeight = window.innerHeight * 0.2;
        const maxHeight = window.innerHeight * 0.8;

        if (newHeight >= minHeight && newHeight <= maxHeight) {
            topHeight.value = newHeight;
        }
    };

    const onMouseUp = () => {
        isResizing = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    // 清理事件监听器
    onUnmounted(() => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    });

    return {
        topHeight,
        startResize
    };
}
