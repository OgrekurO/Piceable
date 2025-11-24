import { ref, computed } from 'vue'
import {
  getItems,
  updateItem,
  CommunicationMethod,
  setCommunicationMethod,
  getLibraryInfo
} from '@/core/services/pluginCommunication'
import type { EagleItem, LibraryInfo } from '@/core/models'
import { ElMessage } from 'element-plus'

// Item 是 EagleItem 的 UI 适配版本,支持更灵活的数据格式
interface Item extends Omit<EagleItem, 'folders' | 'tags' | 'lastModified'> {
  thumbnail: string
  folders: string[] | string
  tags: string[] | string
  lastModified: number | string
}

// 定义响应类型
interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  count?: number
}

export function useItems() {
  const items = ref<Item[]>([])
  const libraryInfo = ref<LibraryInfo | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const editedItems = ref<Record<string, Partial<Item>>>({})

  // 刷新数据
  const refreshData = async () => {
    loading.value = true
    error.value = null

    try {
      // 获取项目列表
      const itemsData = await getItems()
      console.log('[DEBUG] API响应:', itemsData); // 调试日志

      if (itemsData) {
        // 清空现有数据
        items.value = []

        // 确保数据是数组
        const data = Array.isArray(itemsData) ? itemsData : []

        // 处理每个项目
        data.forEach(item => {
          // 创建新的Item对象
          const newItem: Item = {
            id: item.id,
            name: item.name,
            url: item.url || '',
            thumbnail: item.thumbnail || '', // 缩略图字段应该直接使用thumbnail
            folders: item.folders || [],
            tags: item.tags || [],
            annotation: item.annotation || '',
            lastModified: item.lastModified || ''
          }

          // 添加到items数组
          items.value.push(newItem)
        })

        console.log('[DEBUG] 处理后的项目数据:', items.value); // 调试日志
      } else {
        items.value = []
      }

      // 获取库信息
      const libraryData = await getLibraryInfo()
      if (libraryData) {
        libraryInfo.value = libraryData
      }

      ElMessage.success('数据刷新成功')
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取数据失败'
      console.error('刷新数据失败:', err)
      ElMessage.error('数据刷新失败: ' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      loading.value = false
    }
  }

  // 保存项目更改
  const saveItemChanges = async (row: Item) => {
    try {
      const itemToUpdate: Partial<EagleItem> & { id: string } = {
        id: row.id
      }

      // 添加可能的更改字段
      if (row.name !== undefined) itemToUpdate.name = row.name as string
      if (row.annotation !== undefined) itemToUpdate.annotation = row.annotation as string
      if (row.folders !== undefined) {
        const folders = row.folders
        if (typeof folders === 'string') {
          itemToUpdate.folders = folders.split(',').map((f: string) => f.trim()).filter((f: string) => f)
        } else {
          itemToUpdate.folders = folders as string[]
        }
      }
      if (row.tags !== undefined) {
        const tags = row.tags
        if (typeof tags === 'string') {
          itemToUpdate.tags = tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
        } else {
          itemToUpdate.tags = tags as string[]
        }
      }

      await updateItem(itemToUpdate as EagleItem)
      delete editedItems.value[row.id]
      ElMessage.success('更改已保存')
    } catch (err) {
      error.value = err instanceof Error ? err.message : '保存失败'
      console.error('保存项目失败:', err)
      ElMessage.error('保存项目失败: ' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  // 设置通信方式
  const setCommunication = () => {
    setCommunicationMethod(CommunicationMethod.HttpApi)
  }

  return {
    items,
    libraryInfo,
    loading,
    error,
    editedItems,
    refreshData,
    saveItemChanges,
    setCommunication
  }
}