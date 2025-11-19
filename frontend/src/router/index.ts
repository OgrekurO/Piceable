import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { isAdmin } from '@/services/authService'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomePage.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginRegisterPage.vue')
  },
  {
    path: '/table',
    name: 'Table',
    component: () => import('@/views/TablePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/mindmap',
    name: 'MindMap',
    component: () => import('@/views/MindMapPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/AdminDashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/timeline',
    name: 'Timeline',
    component: () => import('@/views/TimeLine.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 如果需要认证但用户未登录
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // 尝试从本地存储恢复认证状态
    if (authStore.restoreAuth) {
      await authStore.restoreAuth()
    }
    
    // 如果仍然未认证，则重定向到登录页
    if (!authStore.isAuthenticated) {
      next('/login')
      return
    }
  }
  
  // 如果需要管理员权限
  if (to.meta.requiresAdmin) {
    // 确保用户信息已加载
    if (!authStore.user) {
      if (authStore.restoreAuth) {
        await authStore.restoreAuth()
      }
    }
    
    // 检查是否为管理员
    if (!authStore.user || !isAdmin(authStore.user)) {
      console.error('权限不足')
      next('/')
      return
    }
  }
  
  next()
})

export default router