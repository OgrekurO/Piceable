import { postToBackend, getFromBackend } from './httpClient';

// 保存访问令牌
export function setAccessToken(token: string): void {
  localStorage.setItem('access_token', token);
}

// 获取访问令牌
export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

// 清除访问令牌
export function clearAccessToken(): void {
  localStorage.removeItem('access_token');
}

// 用户登录
export async function login(username: string, password: string): Promise<{ access_token: string }> {
  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);
  
  // 直接使用fetch因为登录端点需要特殊的form-data格式
  const response = await fetch('http://localhost:8001/api/auth/token', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || '登录失败');
  }
  
  return response.json();
}

// 用户注册
export async function register(userData: { username: string; email: string; password: string }): Promise<any> {
  return postToBackend('/api/auth/register', userData);
}

// 获取当前用户信息
export async function getCurrentUser(): Promise<any> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('未找到访问令牌');
  }
  
  return getFromBackend('/api/users/me');
}
