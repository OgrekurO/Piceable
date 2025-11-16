import { ref, computed } from 'vue'

// 定义数据类型
interface Item {
  id: string
  thumbnail: string
  name: string
  folders: string[] | string
  tags: string[] | string
  annotation: string
  lastModified: number | string
  url: string
}

export function useSearch(items: { value: Item[] } | Item[]) {
  const searchText = ref('')

  // 计算过滤后的项目
  const filteredItems = computed(() => {
    // 获取实际的items数组
    let actualItems: Item[] = []
    if (Array.isArray(items)) {
      actualItems = items
    } else if (items && items.value && Array.isArray(items.value)) {
      actualItems = items.value
    }
    
    console.log('[DEBUG] 原始项目数量:', actualItems.length); // 调试日志
    
    let result = actualItems
    
    // 应用搜索过滤
    if (searchText.value) {
      const searchLower = searchText.value.toLowerCase()
      result = result.filter(item => 
        (item.name && item.name.toLowerCase().includes(searchLower)) ||
        (item.folders && (Array.isArray(item.folders) ? item.folders.join(', ') : item.folders.toString()).toLowerCase().includes(searchLower)) ||
        (item.tags && (Array.isArray(item.tags) ? item.tags.join(', ') : item.tags.toString()).toLowerCase().includes(searchLower)) ||
        (item.annotation && item.annotation.toLowerCase().includes(searchLower))
      )
    }
    
    console.log('[DEBUG] 过滤后项目数量:', result.length); // 调试日志
    
    return result
  })

  // 搜索处理
  const handleSearchInput = () => {
    // 这里可以添加额外的逻辑
  }

  // 清除搜索
  const handleSearchClear = () => {
    searchText.value = ''
  }

  return {
    searchText,
    filteredItems,
    handleSearchInput,
    handleSearchClear
  }
}