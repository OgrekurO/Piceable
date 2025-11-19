import { defineStore } from 'pinia'
import type { User } from '@/types'
import { setAccessToken as saveToken, clearAccessToken, getAccessToken } from '@/services/authService'
import { getCurrentUser } from '@/services/authService'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  accessToken: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: false,
    accessToken: null
  }),
  
  actions: {
    /**
     * 用户登录
     * @param user 用户信息
     * @param token 访问令牌
     */
    login(user: User, token?: string) {
      this.user = user
      this.isAuthenticated = true
      if (token) {
        this.accessToken = token
        saveToken(token)
      }
    },
    
    /**
     * 用户登出
     */
    logout() {
      this.user = null
      this.isAuthenticated = false
      this.accessToken = null
      clearAccessToken()
    },
    
    /**
     * 更新用户信息
     * @param user 用户信息
     */
    updateUserInfo(user: User) {
      this.user = user
    },
    
    /**
     * 设置访问令牌
     * @param token 访问令牌
     */
    setAccessToken(token: string) {
      this.accessToken = token
    },
    
    /**
     * 从本地存储恢复认证状态
     */
    async restoreAuth() {
      const token = getAccessToken()
      if (token) {
        this.accessToken = token
        const user = await getCurrentUser()
        if (user) {
          this.user = user
          this.isAuthenticated = true
        } else {
          // 如果无法获取用户信息，清除令牌
          this.logout()
        }
      }
    }
  },
  
  getters: {
    /**
     * 获取当前用户信息
     */
    currentUser: (state) => state.user,
    
    /**
     * 检查用户是否已认证
     */
    isAuth: (state) => state.isAuthenticated,
    
    /**
     * 获取访问令牌
     */
    getToken: (state) => state.accessToken
  }
})