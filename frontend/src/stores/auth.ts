import { defineStore } from 'pinia'
import type { User } from '@/types'
import { setAccessToken as saveToken, clearAccessToken, getAccessToken } from '@/core/services/authService'
import { getCurrentUser } from '@/core/services/authService'

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
      saveToken(token)
    },

    /**
     * 从本地存储恢复认证状态
     */
    async restoreAuth() {
      console.log('[AUTH] 开始恢复认证状态')
      try {
        // 从localStorage获取访问令牌
        const accessToken = getAccessToken()
        console.log('[AUTH] 从localStorage获取的访问令牌:', accessToken)

        if (accessToken) {
          // 设置访问令牌到store
          this.accessToken = accessToken

          // 验证令牌有效性并获取用户信息
          const user = await getCurrentUser()
          console.log('[AUTH] 获取到的用户信息:', user)

          if (user) {
            this.user = user
            this.isAuthenticated = true
            console.log('[AUTH] 认证状态恢复成功')
          } else {
            // 如果无法获取用户信息，清除令牌
            console.log('[AUTH] 无法获取用户信息，清除认证状态')
            this.logout()
          }
        } else {
          console.log('[AUTH] localStorage中未找到访问令牌')
        }
      } catch (error) {
        console.error('[AUTH] 恢复认证状态失败:', error)
        // 如果获取用户信息失败，清除令牌
        this.logout()
      }

      console.log('[AUTH] 最终认证状态 - isAuthenticated:', this.isAuthenticated)
      return this.isAuthenticated
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
    token: (state) => state.accessToken
  }
})