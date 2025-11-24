import { ref, computed, type Ref } from 'vue'

/**
 * 数据源类型
 */
export type DataSourceType = 'upload' | 'eagle' | 'manual' | null

/**
 * 数据源配置
 */
interface DataSourceConfig {
    type: DataSourceType
    projectId?: number
}

/**
 * 统一数据源适配器 Composable
 * 使用策略模式处理不同的数据源,避免在 View 层写大量 if-else
 */
export function useUnifiedDataSource(
    eagleData: Ref<any[]>,
    projectData: Ref<any[]>,
    eagleLoading: Ref<boolean>,
    projectLoading: Ref<boolean>
) {
    const currentSource = ref<DataSourceType>(null)

    /**
     * 当前数据(根据数据源自动切换)
     */
    const currentData = computed(() => {
        switch (currentSource.value) {
            case 'eagle':
                return eagleData.value
            case 'upload':
            case 'manual':
                return projectData.value
            default:
                return []
        }
    })

    /**
     * 当前加载状态(根据数据源自动切换)
     */
    const currentLoading = computed(() => {
        switch (currentSource.value) {
            case 'eagle':
                return eagleLoading.value
            case 'upload':
            case 'manual':
                return projectLoading.value
            default:
                return false
        }
    })

    /**
     * 是否是 Eagle 数据源
     */
    const isEagleSource = computed(() => currentSource.value === 'eagle')

    /**
     * 是否是项目数据源
     */
    const isProjectSource = computed(() =>
        currentSource.value === 'upload' || currentSource.value === 'manual'
    )

    /**
     * 切换数据源
     */
    const switchSource = (config: DataSourceConfig) => {
        currentSource.value = config.type
        console.log('[useUnifiedDataSource] 切换数据源:', config.type)
    }

    /**
     * 获取数据源描述
     */
    const getSourceDescription = computed(() => {
        switch (currentSource.value) {
            case 'eagle':
                return 'Eagle 插件数据'
            case 'upload':
                return '上传的项目数据'
            case 'manual':
                return '手动创建的数据'
            default:
                return '未选择数据源'
        }
    })

    return {
        currentSource,
        currentData,
        currentLoading,
        isEagleSource,
        isProjectSource,
        switchSource,
        getSourceDescription
    }
}
