import { ref, computed } from 'vue'
import type { FieldDefinition } from '@/core/models/schema'
import { FieldSemanticRole } from '@/core/models/schema'

/**
 * 字段语义检测 Composable
 * 根据字段名称智能推测字段的语义角色
 */
export function useFieldSemanticDetection() {
    /**
     * 检测字段的语义角色
     * @param fieldName 字段名称
     * @returns 推测的语义角色,如果无法推测则返回 undefined
     */
    const detectSemanticRole = (fieldName: string): FieldSemanticRole | undefined => {
        const lowerName = fieldName.toLowerCase()

        // 主名称检测
        if (
            lowerName === 'name' ||
            lowerName === 'label' ||
            lowerName === 'title' ||
            lowerName === '名称' ||
            lowerName === '标题'
        ) {
            return FieldSemanticRole.PRIMARY_LABEL
        }

        // 地址检测
        if (
            lowerName.includes('address') ||
            lowerName.includes('location') ||
            lowerName.includes('place') ||
            lowerName.includes('city') ||
            lowerName.includes('birthplace') ||
            lowerName.includes('地址') ||
            lowerName.includes('位置') ||
            lowerName.includes('地点') ||
            lowerName.includes('出生地')
        ) {
            return FieldSemanticRole.ADDRESS
        }

        // 时间检测
        if (
            lowerName.includes('date') ||
            lowerName.includes('time') ||
            lowerName.includes('timestamp') ||
            lowerName.includes('日期') ||
            lowerName.includes('时间')
        ) {
            return FieldSemanticRole.TIMESTAMP
        }

        // 描述检测
        if (
            lowerName.includes('description') ||
            lowerName.includes('desc') ||
            lowerName.includes('note') ||
            lowerName.includes('comment') ||
            lowerName.includes('描述') ||
            lowerName.includes('备注') ||
            lowerName.includes('说明')
        ) {
            return FieldSemanticRole.DESCRIPTION
        }

        // 图片检测
        if (
            lowerName.includes('image') ||
            lowerName.includes('img') ||
            lowerName.includes('photo') ||
            lowerName.includes('picture') ||
            lowerName.includes('avatar') ||
            lowerName.includes('图片') ||
            lowerName.includes('照片') ||
            lowerName.includes('头像')
        ) {
            return FieldSemanticRole.IMAGE_URL
        }

        // 分类检测
        if (
            lowerName.includes('category') ||
            lowerName.includes('type') ||
            lowerName.includes('kind') ||
            lowerName.includes('class') ||
            lowerName.includes('分类') ||
            lowerName.includes('类型') ||
            lowerName.includes('类别')
        ) {
            return FieldSemanticRole.CATEGORY
        }

        return undefined
    }

    /**
     * 批量检测字段语义
     * @param fields 字段定义数组
     * @returns 字段名到语义角色的映射
     */
    const detectFieldSemantics = (fields: FieldDefinition[]): Record<string, FieldSemanticRole> => {
        const semantics: Record<string, FieldSemanticRole> = {}

        for (const field of fields) {
            const role = detectSemanticRole(field.label || field.key)
            if (role) {
                semantics[field.key] = role
            }
        }

        return semantics
    }

    /**
     * 获取语义角色的中文标签
     */
    const getSemanticRoleLabel = (role: FieldSemanticRole): string => {
        const labels: Record<FieldSemanticRole, string> = {
            primary_label: '主名称',
            address: '地址',
            timestamp: '时间',
            description: '描述',
            image_url: '图片',
            category: '分类',
            custom: '自定义'
        }
        return labels[role] || role
    }

    /**
     * 获取语义角色的图标
     */
    const getSemanticRoleIcon = (role: FieldSemanticRole): string => {
        const icons: Record<FieldSemanticRole, string> = {
            primary_label: '🏷️',
            address: '📍',
            timestamp: '⏰',
            description: '📝',
            image_url: '🖼️',
            category: '📂',
            custom: '⚙️'
        }
        return icons[role] || '❓'
    }

    return {
        detectSemanticRole,
        detectFieldSemantics,
        getSemanticRoleLabel,
        getSemanticRoleIcon
    }
}
