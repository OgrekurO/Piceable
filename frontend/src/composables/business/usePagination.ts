import { ref, watch } from 'vue'
import type { VxeGridPropTypes } from 'vxe-table'
import type { VxePagerEvents } from 'vxe-pc-ui'

export function usePagination() {
  // 表格配置
  const gridOptions = ref<VxeGridPropTypes.PagerConfig>({
    currentPage: 1,
    pageSize: 50,
    pageSizes: [10, 20, 50, 100, 200, 500]
  })

  // 根据页面大小计算表格高度
  const getTableHeight = () => {
    // 每行大约高度为60px，加上表头和一些边距
    const rowHeight = 60
    const headerHeight = 50
    const totalHeight = (gridOptions.value.pageSize || 50) * rowHeight + headerHeight
    
    // 设置最小和最大高度
    const minHeight = 500
    const maxHeight = 2000
    
    if (totalHeight < minHeight) return minHeight
    if (totalHeight > maxHeight) return maxHeight
    return totalHeight
  }

  // 处理页面变化
  const handlePageChange: VxePagerEvents.PageChange = ({ currentPage, pageSize }) => {
    gridOptions.value.currentPage = currentPage
    gridOptions.value.pageSize = pageSize
  }

  // 监听pageSize变化，更新表格配置高度
  watch(() => gridOptions.value.pageSize, (newPageSize) => {
    // 这里可以触发更新表格高度的操作
  })

  return {
    gridOptions,
    getTableHeight,
    handlePageChange
  }
}