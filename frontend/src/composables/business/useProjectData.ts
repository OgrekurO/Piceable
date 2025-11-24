import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getProject } from '@/core/services/projectService'

/**
 * 项目数据加载 Composable
 * 负责项目信息的加载
 */
export function useProjectData() {
    const loading = ref(false)
    const currentProjectId = ref<number | null>(null)
    const currentProject = ref<any | null>(null)
    const router = useRouter()

    /**
     * 加载项目信息
     */
    const loadProject = async (projectId: number) => {
        loading.value = true
        try {
            const project = await getProject(projectId)
            console.log('[useProjectData] 加载项目:', project.name)

            currentProjectId.value = projectId
            currentProject.value = project

            return project
        } catch (err: any) {
            console.error('[useProjectData] 加载项目失败:', err)

            if (err.message && err.message.includes('401')) {
                router.push('/login')
            }

            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        currentProjectId,
        currentProject,
        loadProject
    }
}
