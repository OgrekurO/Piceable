import { ref } from 'vue'

/**
 * 地理编码 Composable
 * 提供地址到坐标转换的功能
 */
export function useGeocoding() {
    const geocoding = ref(false)
    const progress = ref(0)
    const total = ref(0)

    /**
     * 批量地理编码
     * @param projectId 项目ID
     * @param addresses 地址列表
     * @param fieldName 地址字段名称
     * @returns 地理编码结果
     */
    const geocodeAddresses = async (
        projectId: number,
        addresses: string[],
        fieldName: string
    ) => {
        geocoding.value = true
        progress.value = 0
        total.value = addresses.length

        try {
            const response = await fetch(
                `/api/projects/${projectId}/geocode`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    },
                    body: JSON.stringify({
                        addresses,
                        field_name: fieldName
                    })
                }
            )

            if (!response.ok) {
                throw new Error(`地理编码失败: ${response.statusText}`)
            }

            const result = await response.json()

            console.log('[useGeocoding] 地理编码完成:', {
                成功: Object.keys(result.results).length,
                失败: result.failed.length,
                缓存命中: result.cached_count,
                新编码: result.new_count
            })

            return result
        } catch (error) {
            console.error('[useGeocoding] 地理编码错误:', error)
            throw error
        } finally {
            geocoding.value = false
        }
    }

    /**
     * 单个地址地理编码
     * @param projectId 项目ID
     * @param address 地址
     * @param fieldName 地址字段名称
     * @returns 坐标信息
     */
    const geocodeSingleAddress = async (
        projectId: number,
        address: string,
        fieldName: string
    ) => {
        const result = await geocodeAddresses(projectId, [address], fieldName)
        return result.results[address] || null
    }

    return {
        geocoding,
        progress,
        total,
        geocodeAddresses,
        geocodeSingleAddress
    }
}
