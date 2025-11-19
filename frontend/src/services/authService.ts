import { postToBackend, getFromBackend, putToBackend } from './httpClient'
import type { User } from '@/types'

/**
 * 用户登录
 * @param username 用户名
 * @param password 密码
 * @returns 登录结果
 */
export async function login(username: string, password: string) {
  try {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    
    // 使用原始fetch发送表单数据
    const response = await fetch('http://localhost:8001/api/auth/token', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    const { access_token } = data
    return { success: true, token: access_token }
  } catch (error: any) {
    console.error('登录失败:', error)
    return { 
      success: false, 
      message: error.response?.data?.detail || '登录失败' 
    }
  }
}

/**
 * 用户注册
 * @param userData 用户数据
 * @returns 注册结果
 */
export async function register(userData: { username: string; email: string; password: string }) {
  try {
    const response = await postToBackend('/api/auth/register', userData)
    return { success: true, user: response }
  } catch (error: any) {
    console.error('注册失败:', error)
    return { 
      success: false, 
      message: error.response?.data?.detail || '注册失败' 
    }
  }
}

/**
 * 获取当前用户信息
 * @returns 用户信息
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await getFromBackend('/api/users/me')
    return response
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}

/**
 * 获取所有用户列表（仅管理员）
 * @returns 用户列表
 */
export async function getAllUsers(): Promise<User[] | null> {
  try {
    const response = await getFromBackend('/api/auth/users')
    return response
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return null
  }
}

/**
 * 更新用户角色（仅管理员）
 * @param userId 用户ID
 * @param roleId 角色ID
 * @returns 更新结果
 */
export async function updateUserRole(userId: number, roleId: number) {
  try {
    const response = await putToBackend(`/api/auth/users/${userId}/role`, { role_id: roleId })
    return { success: true, data: response }
  } catch (error: any) {
    console.error('更新用户角色失败:', error)
    return { 
      success: false, 
      message: error.response?.data?.detail || '更新用户角色失败' 
    }
  }
}

/**
 * 检查用户是否为管理员
 * @param user 用户对象
 * @returns 是否为管理员
 */
export function isAdmin(user: User | null): boolean {
  return user !== null && user.roleId === 1
}

/**
 * 获取存储的访问令牌
 * @returns 访问令牌
 */
export function getAccessToken(): string | null {
  return localStorage.getItem('access_token')
}

/**
 * 设置访问令牌
 * @param token 访问令牌
 */
export function setAccessToken(token: string): void {
  localStorage.setItem('access_token', token)
}

/**
 * 清除访问令牌
 */
export function clearAccessToken(): void {
  localStorage.removeItem('access_token')
}