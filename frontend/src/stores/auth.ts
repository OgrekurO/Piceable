import { defineStore } from 'pinia'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: false
  }),
  
  actions: {
    /**
     * 用户登录
     * @param user 用户信息
     */
    login(user: User) {
      this.user = user
      this.isAuthenticated = true
    },
    
    /**
     * 用户登出
     */
    logout() {
      this.user = null
      this.isAuthenticated = false
    },
    
    /**
     * 更新用户信息
     * @param user 用户信息
     */
    updateUserInfo(user: User) {
      this.user = user
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
    isAuth: (state) => state.isAuthenticated
  }
})