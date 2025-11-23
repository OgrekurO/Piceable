import { getLibraryInfo, getItems } from './pluginCommunication'
import { getProjects, createProject, type Project } from './projectService'
import type { ProjectSchema, FieldType } from '../types/schema'

/**
 * Eagle 同步服务
 * 处理从 Eagle 同步数据到项目的逻辑
 */

/**
 * 检查 Eagle 库是否已经同步过
 * @param eagleLibraryPath Eagle 库的路径（作为唯一标识）
 * @returns 如果已同步，返回对应的项目；否则返回 null
 */
export async function findExistingEagleProject(eagleLibraryPath: string): Promise<Project | null> {
    try {
        const projects = await getProjects()

        // 查找 source_type 为 'eagle' 且 source_metadata.library_path 匹配的项目
        const existingProject = projects.find(project =>
            project.source_type === 'eagle' &&
            project.source_metadata?.library_path === eagleLibraryPath
        )

        return existingProject || null
    } catch (error) {
        console.error('[EagleSync] 查找已有项目失败:', error)
        throw error
    }
}

/**
 * 从 Eagle 同步数据
 * 如果该 Eagle 库已经同步过，返回已有项目
 * 如果是新的 Eagle 库，创建新项目并同步数据
 * @returns 项目 ID
 */
export async function syncFromEagle(): Promise<{ projectId: number; isNew: boolean; projectName: string }> {
    try {
        console.log('[EagleSync] 开始同步 Eagle 数据...')

        // 1. 获取 Eagle 库信息
        const libraryInfo = await getLibraryInfo()
        console.log('[EagleSync] Eagle 库信息:', libraryInfo)

        const { name: libraryName, path: libraryPath } = libraryInfo

        // 2. 检查是否已经同步过该 Eagle 库
        const existingProject = await findExistingEagleProject(libraryPath)

        if (existingProject) {
            console.log('[EagleSync] 找到已同步的项目:', existingProject.name)
            return {
                projectId: existingProject.id,
                isNew: false,
                projectName: existingProject.name
            }
        }

        // 3. 如果是新的 Eagle 库，获取数据并创建项目
        console.log('[EagleSync] 这是新的 Eagle 库，开始同步数据...')
        const eagleItems = await getItems()
        console.log('[EagleSync] 获取到 Eagle 项目数:', eagleItems.length)

        // 4. 生成 Schema（基于 Eagle 数据结构）
        const schema: ProjectSchema = {
            fields: [
                { key: 'name', label: '名称', type: 'text' as FieldType, is_primary: true },
                { key: 'folders', label: '文件夹', type: 'text' as FieldType },
                { key: 'tags', label: '标签', type: 'text' as FieldType },
                { key: 'annotation', label: '注释', type: 'text' as FieldType },
                { key: 'url', label: 'URL', type: 'url' as FieldType },
                { key: 'thumbnail', label: '缩略图', type: 'image' as FieldType }
            ]
        }

        // 5. 创建项目
        const newProject = await createProject(
            `Eagle - ${libraryName}`,
            `从 Eagle 库同步: ${libraryPath}`,
            schema
        )

        console.log('[EagleSync] 项目创建成功:', newProject.id)

        // 6. 更新项目的 source_metadata（记录 Eagle 库信息）
        // 注意：这需要后端支持更新 source_metadata
        // 暂时通过 source_type 和创建时的 description 来标识

        // 7. 上传 Eagle 数据到项目
        const itemsData = eagleItems.map(item => ({
            id: item.id,
            name: item.name,
            folders: Array.isArray(item.folders) ? item.folders.join(', ') : item.folders,
            tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags,
            annotation: item.annotation || '',
            url: item.url || '',
            thumbnail: item.thumbnail || '',
            lastModified: item.lastModified
        }))

        // 调用上传 API
        const response = await fetch('http://localhost:8001/api/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({
                projectId: newProject.id,
                projectName: newProject.name,
                items: itemsData,
                table_schema: schema
            })
        })

        if (!response.ok) {
            throw new Error(`上传数据失败: ${response.statusText}`)
        }

        console.log('[EagleSync] 数据同步成功')

        return {
            projectId: newProject.id,
            isNew: true,
            projectName: newProject.name
        }
    } catch (error) {
        console.error('[EagleSync] 同步失败:', error)
        throw error
    }
}
