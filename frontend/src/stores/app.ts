/**
 * 应用状态管理模块
 */
import { defineStore } from 'pinia'
// import { User } from '../types/user.ts'
import type { LibraryInfo } from '../types/index.ts'

interface AppState {
  // user: User | null;
  user: any;
  libraryInfo: LibraryInfo | null;
  loading: boolean;
  error: string | null;
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    user: null,
    libraryInfo: null,
    loading: false,
    error: null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.user,
    hasLibraryInfo: (state) => !!state.libraryInfo
  },
  
  actions: {
    /**
     * 设置用户信息
     * @param user 用户信息
     */
    // setUser(user: User | null) {
    setUser(user: any) {
      this.user = user
    },
    
    /**
     * 设置库信息
     * @param libraryInfo 库信息
     */
    setLibraryInfo(libraryInfo: LibraryInfo | null) {
      this.libraryInfo = libraryInfo
    },
    
    /**
     * 设置加载状态
     * @param loading 加载状态
     */
    setLoading(loading: boolean) {
      this.loading = loading
    },
    
    /**
     * 设置错误信息
     * @param error 错误信息
     */
    setError(error: string | null) {
      this.error = error
    },
    
    /**
     * 清除错误信息
     */
    clearError() {
      this.setError(null)
    }
  }
})