import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { isAdmin } from '@/core/services/authService'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/dashboard/HomePage.vue')
      },
      {
        path: '/table',
        name: 'Table',
        component: () => import('@/views/project/TablePage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: '/mindmap',
        name: 'MindMap',
        component: () => import('@/views/project/MindMapPage.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: '/admin',
        name: 'Admin',
        component: () => import('@/views/dashboard/AdminDashboard.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: '/coordinate',
        name: 'Coordinate',
        component: () => import('@/views/project/CoordinatePage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: '/map',
        name: 'Map',
        component: () => import('@/views/project/MapView.vue'),
        meta: { requiresAuth: false }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginPage.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/dashboard/SettingsPage.vue')
  },
  {
    path: '/phone-login',
    name: 'PhoneLogin',
    component: () => import('@/views/auth/PhoneLogin.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterPage.vue')
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/auth/ForgotPassword.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 只有需要认证的路由才进行登录检查
  if (to.meta.requiresAuth) {
    // 如果未认证，尝试从本地存储恢复
    if (!authStore.isAuthenticated) {
      await authStore.restoreAuth()
    }

    // 如果仍然未认证，重定向到登录页
    if (!authStore.isAuthenticated) {
      next('/login')
      return
    }
  }

  // 如果需要管理员权限
  if (to.meta.requiresAdmin) {
    // 确保用户信息已加载
    if (!authStore.user) {
      await authStore.restoreAuth()
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