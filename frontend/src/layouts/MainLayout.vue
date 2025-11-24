<template>
  <div class="main-layout">
    <header class="header">
      <div class="header-left">
        <!-- 功能按钮 -->
        <div class="menu-button" @click="toggleSidebar">
          <svg v-if="!showSidebar" width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <svg v-else width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <!-- 点击Piceable文字返回主页 -->
        <span class="logo">
          <router-link to="/" class="logo-link">Piceable</router-link>
        </span>
        <!-- 项目切换下拉菜单 -->
        <div class="project-switcher" v-if="shouldShowProjectSwitcher">
          <div class="project-dropdown" @click="toggleProjectDropdown">
            <span class="current-project">{{ currentProjectName }}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="dropdown-icon">
              <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            
            <!-- 项目下拉菜单 -->
            <div class="project-dropdown-menu" v-show="showProjectDropdown">
              <div class="dropdown-item" 
                v-for="project in projects" 
                :key="project.id"
                :class="{ active: project.id === currentProjectId }"
                @click.stop="selectProject(project)">
                <span class="project-name">{{ project.name }}</span>
                <span class="project-count">{{ project.items_count }} 项</span>
              </div>
              <div class="dropdown-divider"></div>
              <router-link to="/" class="dropdown-item create-project" @click.stop="showProjectDropdown = false">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>创建新项目</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>

      
      <div class="header-center">
        <!-- 搜索框 -->
        <div class="search-container" v-show="!showSidebar">
          <input 
            type="text" 
            class="search-box" 
            placeholder="搜索..." 
            v-model="searchText"
            @input="onSearch"
          />
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        
        <!-- 导航链接 -->
        <div class="nav-links" v-show="showSidebar">
          <router-link :to="{ path: '/coordinate', query: { projectId: currentProjectId, source: currentSource } }" class="nav-link" @click="showSidebar = false">坐标</router-link>
          <router-link :to="{ path: '/table', query: { projectId: currentProjectId, source: currentSource } }" class="nav-link" @click="showSidebar = false">表格</router-link>
          <router-link :to="{ path: '/mindmap', query: { projectId: currentProjectId, source: currentSource } }" class="nav-link" @click="showSidebar = false">图谱</router-link>
          <router-link :to="{ path: '/map', query: { projectId: currentProjectId, source: currentSource } }" class="nav-link" @click="showSidebar = false">地图</router-link>
        </div>
      </div>
      
      <div class="header-right">
        <div class="auth-buttons" v-if="!authStore.isAuth">
          <router-link to="/login" class="auth-link login">登录</router-link>
          <router-link to="/login" class="auth-link register">注册</router-link>
        </div>
        
        <div class="user-info" v-else>
          <div class="user-dropdown" @click="toggleUserDropdown">
            <span class="username">{{ authStore.currentUser?.username }}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="dropdown-icon">
              <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            
            <!-- 下拉菜单 -->
            <div class="user-dropdown-menu" v-show="showUserDropdown">
              <router-link to="/admin" class="dropdown-item" v-if="authStore.currentUser?.roleId === 1">管理面板</router-link>
              <router-link to="/settings" class="dropdown-item">设置</router-link>
              <button class="dropdown-item logout-btn" @click="handleLogout">退出</button>
            </div>
          </div>
        </div>
      </div>
    </header>
    
    <main class="content">
      <router-view />
    </main>
    
    <footer class="footer" style="display: none;">
      <p>&copy; 2025 Eagle Ontology Manager. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/projectStore'
import { getProjects, type Project, onProjectUpdate } from '@/core/services/projectService'
import { getUploadedItems } from '@/core/services/uploadedItemsService'

// 获取认证存储和路由实例
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const projectStore = useProjectStore()

// ========== 本地状态 ==========
const showSidebar = ref(false)
const searchText = ref('')
const showUserDropdown = ref(false)
const showProjectDropdown = ref(false)
const projects = ref<Project[]>([])
const currentProjectId = ref<number | null>(null)

// ========== Computed 属性 ==========
const shouldShowProjectSwitcher = computed(() => {
  const projectRoutes = ['/coordinate', '/table', '/mindmap', '/map']
  return projectRoutes.some(path => route.path.startsWith(path))
})

const currentProjectName = computed(() => {
  if (!currentProjectId.value) return '选择项目'
  const project = projects.value.find(p => p.id === currentProjectId.value)
  return project?.name || '未知项目'
})

const currentSource = computed(() => {
  return route.query.source as string || 'default'
})

// ========== 方法 ==========
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

const toggleUserDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value
}

const toggleProjectDropdown = () => {
  showProjectDropdown.value = !showProjectDropdown.value
}

const onSearch = () => {
  // 实现搜索逻辑
  console.log('搜索:', searchText.value)
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const fetchProjects = async () => {
  try {
    const fetchedProjects = await getProjects()
    projects.value = fetchedProjects
    
    // 如果有路由参数中的 projectId,使用它
    if (route.query.projectId) {
      currentProjectId.value = parseInt(route.query.projectId as string)
    } else if (fetchedProjects.length > 0 && fetchedProjects[0]) {
      // 否则使用第一个项目
      currentProjectId.value = fetchedProjects[0].id
    }
    
    console.log('[MainLayout] 已加载项目列表:', projects.value.length)
  } catch (error) {
    console.error('获取项目列表失败:', error)
  }
}

// 加载项目数据到 projectStore
const loadProjectData = async (projectId: number) => {
  try {
    const items = await getUploadedItems(projectId)
    const project = projects.value.find(p => p.id === projectId)
    
    if (project && project.schema) {
      // 更新 projectStore
      projectStore.loadItems(items, project.schema)
      
      console.log(`[MainLayout] 已加载项目 ${project.name} 的数据，共 ${items.length} 项`)
    }
  } catch (error) {
    console.error('加载项目数据失败:', error)
  }
}

// 选择项目
const selectProject = async (project: Project) => {
  showProjectDropdown.value = false
  currentProjectId.value = project.id
  
  // 更新路由参数
  router.push({
    path: route.path,
    query: {
      ...route.query,
      projectId: project.id.toString()
    }
  })
  
  // 加载项目数据
  await loadProjectData(project.id)
}

// 监听路由变化
watch(() => route.query.projectId, (newProjectId) => {
  if (newProjectId && parseInt(newProjectId as string) !== currentProjectId.value) {
    currentProjectId.value = parseInt(newProjectId as string)
    loadProjectData(currentProjectId.value)
  }
})

// 监听是否应该显示项目切换器
watch(shouldShowProjectSwitcher, (shouldShow) => {
  if (shouldShow && authStore.isAuth && projects.value.length === 0) {
    // 当进入需要显示项目切换器的页面时，获取项目列表
    fetchProjects()
  }
})

// 组件挂载时
onMounted(() => {
  if (authStore.isAuth) {
    fetchProjects()
  }
  
  // 注册项目更新监听器
  const cleanup = onProjectUpdate(() => {
    console.log('[MainLayout] 收到项目更新通知，刷新项目列表')
    if (authStore.isAuth) {
      fetchProjects()
    }
  })
  
  // 组件卸载时清理监听器
  onUnmounted(() => {
    cleanup()
  })
})

// 点击其他地方关闭用户下拉菜单
document.addEventListener('click', (event) => {
  const userDropdown = document.querySelector('.user-dropdown')
  if (userDropdown && !userDropdown.contains(event.target as Node)) {
    showUserDropdown.value = false
  }
  
  const projectDropdown = document.querySelector('.project-dropdown')
  if (projectDropdown && !projectDropdown.contains(event.target as Node)) {
    showProjectDropdown.value = false
  }
})
</script>

<style scoped>

.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
}

.header {
  display: flex;
  align-items: center;
  padding: 0 1rem;
  height: 10vh;
  background-color: var(--color-background);
  border-bottom: 1.5px solid var(--border-color); /* 使用统一的颜色变量 */
  position: relative;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-left .menu-button {
  width: 40px;
  height: 40px;
  margin-right: 10px; /* 调整按钮与品牌名称之间的间距 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text);
}

.logo {
  display: flex;
  align-items: center;
  overflow: hidden;
  width: auto; /* 移除固定宽度，让文字自适应 */
}

.logo-link {
  color: var(--color-text);
  font-size: 20px; /* 调整字体大小 */
  font-weight: bold;
  font-family: 'SimHei', '黑体', 'Heiti SC', 'Microsoft YaHei', sans-serif;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  margin: 0 auto; /* 居中对齐 */
}

.search-container {
  width: 40%;
  height: 30px;
  position: relative;
  min-width: 200px; /* 设置最小宽度 */
}

.search-box {
  padding: 6px 30px 6px 10px; /* 为图标留出空间 */
  border: none;
  border-radius: 6px;
  font-size: 14px;
  width: 100%;
  height: 100%;
  background-color: var(--vt-c-white-mute);
  transition: all 0.1s;
  box-sizing: border-box;
}

.search-box:focus {
  outline: none;
  border: none;
  background-color: white;
  box-shadow: 0 0 0 2px rgba(60, 60, 60, 0.1);
  width: 100%;
}

.search-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--medium-gray);
  pointer-events: none; /* 图标不响应鼠标事件 */
}

.nav-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  width: 100%;
  height: 30px;
  min-width: 200px; /* 设置最小宽度 */
}

.nav-link {
  text-decoration: none;
  color: var(--color-text);
  font-size: 16px;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s;
}

.nav-link:hover{
  color: var(--color-text);
  font-weight: bold;
}


.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-left: auto;
  height: 100%;
  position: relative;
}


.auth-buttons {
  display: flex;
  gap: 0.1rem;
  align-items: center;
}

.auth-link {
  text-decoration: none;
  color: var(--color-text);
  padding: 0rem 0.5rem;
  border-radius: 6px;
  transition: all 0.3s;
  font-size: 16px;
  background-color: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-link:hover {
  color: var(--color-text);
  background-color: transparent;
}

.auth-link.login {
  background-color: transparent;
  color: var(--color-text-mute);
  border: none;
}

.auth-link.login:hover {
  background-color: transparent;
  color: var(--color-text);
  border: none;
}

.auth-link.register {
  background-color: transparent;
  color: var(--color-text-mute);
  border: none;
}

.auth-link.register:hover {
  background-color: transparent;
  color: var(--color-text);
  border: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-dropdown {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.user-dropdown:hover {
  background-color: var(--color-background);
}

.username {
  font-weight: 500;
  font-size: 16px;
  color: var(--color-text);
}

.dropdown-icon {
  transition: transform 0.3s;
}

.user-dropdown:hover .dropdown-icon {
  transform: rotate(180deg);
}

.user-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--color-background);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 150px;
  z-index: 1000;
  margin-top: 0.5rem;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: var(--color-text-mute);
  font-size: 14px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  border-radius: 0;
}

.dropdown-item:hover {
  background-color: var(--color-background);
  color: #000;
}

.dropdown-item.logout-btn {
  color: var(--danger-color);
  font-weight: normal;
}

.dropdown-item.logout-btn:hover {
  background-color: #f8d7da;
  color: var(--danger-color);
}

.logout-btn {
  padding: 0.5rem 1rem;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: var(--danger-color);
}

.content {
  flex: 1;
  padding: 0;
  height: calc(100vh - var(--header-height));
  min-height: calc(100vh - var(--header-height));
  position: relative;
  margin-top: 0;
}



.footer {
  padding: 0.8rem 1rem;
  background-color: var(--light-gray);
  border-top: 1px solid var(--border-color);
  text-align: center;
  color: var(--medium-gray);
  font-size: 14px;
  display: none;
}

/* 项目切换器样式 */
.project-switcher {
  margin-left: 2rem;
}

.project-dropdown {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: background-color 0.3s;
  border: 1px solid var(--border-color);
  background-color: var(--color-background);
  min-width: 150px;
}

.project-dropdown:hover {
  background-color: var(--vt-c-white-mute);
}

.current-project {
  font-weight: 500;
  font-size: 14px;
  color: var(--color-text);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-dropdown .dropdown-icon {
  transition: transform 0.3s;
  flex-shrink: 0;
}

.project-dropdown:hover .dropdown-icon {
  transform: rotate(180deg);
}

.project-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: var(--color-background);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 250px;
  max-width: 350px;
  z-index: 1000;
  margin-top: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.project-dropdown-menu .dropdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: var(--color-text-mute);
  font-size: 14px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  border-radius: 0;
  transition: all 0.2s;
}

.project-dropdown-menu .dropdown-item:hover {
  background-color: var(--vt-c-white-mute);
  color: var(--color-text);
}

.project-dropdown-menu .dropdown-item.active {
  background-color: var(--vt-c-white-soft);
  color: var(--color-text);
  font-weight: 500;
}

.project-dropdown-menu .dropdown-item.active::before {
  content: '✓';
  margin-right: 0.5rem;
  color: #2563eb;
}

.project-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-count {
  font-size: 12px;
  color: var(--color-text-mute);
  margin-left: 0.5rem;
  flex-shrink: 0;
}

.dropdown-divider {
  height: 1px;
  background-color: var(--border-color);
  margin: 0.5rem 0;
}

.project-dropdown-menu .create-project {
  color: #2563eb;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.project-dropdown-menu .create-project:hover {
  background-color: #eff6ff;
  color: #1d4ed8;
}

/* 媒体查询：当屏幕宽度较小时隐藏搜索框 */
@media (max-width: 600px) {
  .search-container {
    display: none;
  }
  
  .nav-links {
    width: auto;
    min-width: unset;
  }
  
  .project-switcher {
    margin-left: 1rem;
  }
  
  .project-dropdown {
    min-width: 120px;
  }
}
</style>