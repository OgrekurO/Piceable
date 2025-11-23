/**
 * HTTP客户端服务 - 与独立HTTP API服务通信 */

import { getAccessToken } from './authService';

// HTTP客户端 - 用于与独立HTTP API服务通信
const EAGLE_PLUGIN_BASE_URL = 'http://localhost:3001';
const BACKEND_API_BASE_URL = 'http://localhost:8001';

/**
 * 发送HTTP请求到Eagle插件
 * @param endpoint API端点
 * @param options 请求选项
 * @returns Promise
 */
export async function requestToEaglePlugin(endpoint: string, options: RequestInit = {}) {
  try {
    const url = `${EAGLE_PLUGIN_BASE_URL}${endpoint}`;
    console.log(`[HTTP_CLIENT] 发送请求到Eagle插件: ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[HTTP_CLIENT] 收到响应:`, data);

    return data;
  } catch (error) {
    console.error(`[HTTP_CLIENT] 请求失败:`, error);
    throw error;
  }
}

/**
 * 发送HTTP请求到后端API
 * @param endpoint API端点
 * @param options 请求选项
 * @returns Promise
 */
export async function requestToBackend(endpoint: string, options: RequestInit = {}) {
  try {
    const url = `${BACKEND_API_BASE_URL}${endpoint}`;
    console.log(`[HTTP_CLIENT] 发送请求到后端API: ${options.method || 'GET'} ${url}`);

    // 添加认证头
    const token = getAccessToken();
    console.log(`[HTTP_CLIENT] Token:`, token ? `存在 (${token.substring(0, 20)}...)` : '不存在');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`[HTTP_CLIENT] Headers:`, headers);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[HTTP_CLIENT] 收到响应:`, data);

    return data;
  } catch (error) {
    console.error(`[HTTP_CLIENT] 请求失败:`, error);
    throw error;
  }
}

/**
 * GET请求到Eagle插件
 * @param endpoint API端点
 * @returns Promise
 */
export function getFromEaglePlugin(endpoint: string) {
  return requestToEaglePlugin(endpoint, { method: 'GET' });
}

/**
 * GET请求到后端API
 * @param endpoint API端点
 * @returns Promise
 */
export function getFromBackend(endpoint: string) {
  return requestToBackend(endpoint, { method: 'GET' });
}

/**
 * POST请求到Eagle插件
 * @param endpoint API端点
 * @param data 请求数据
 * @returns Promise
 */
export function postToEaglePlugin(endpoint: string, data: any) {
  return requestToEaglePlugin(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * POST请求到后端API
 * @param endpoint API端点
 * @param data 请求数据
 * @returns Promise
 */
export function postToBackend(endpoint: string, data: any) {
  return requestToBackend(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT请求到后端API
 * @param endpoint API端点
 * @param data 请求数据
 * @returns Promise
 */
export function putToBackend(endpoint: string, data: any) {
  return requestToBackend(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE请求到后端API
 * @param endpoint API端点
 * @returns Promise
 */
export function deleteFromBackend(endpoint: string) {
  return requestToBackend(endpoint, { method: 'DELETE' });
}

/**
 * DELETE请求到Eagle插件
 * @param endpoint API端点
 * @returns Promise
 */
export function deleteFromEaglePlugin(endpoint: string) {
  return requestToEaglePlugin(endpoint, { method: 'DELETE' });
}

/**
 * PUT请求到Eagle插件
 * @param endpoint API端点
 * @param data 请求数据
 * @returns Promise
 */
export function putToEaglePlugin(endpoint: string, data: any) {
  return requestToEaglePlugin(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// 定义项目数据类型
export interface EagleItem {
  id: string;
  name: string;
  folders: string[];
  tags: string[];
  annotation: string;
  url: string;
  lastModified: number;
  thumbnail?: string;
}

// API响应类型
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
  message?: string;
}

/**
 * 获取项目列表
 * @returns Promise<EagleItem[]>
 */
export async function getItems(): Promise<EagleItem[]> {
  console.log('[HTTP_CLIENT] 获取项目列表');
  const response = await requestToEaglePlugin<{ success: boolean; data: EagleItem[]; count: number }>('/api/items');
  if (response.success) {
    return response.data;
  }
  throw new Error(response.error || '获取项目列表失败');
}

/**
 * 获取单个项目
 * @param id 项目ID
 * @returns Promise<EagleItem>
 */
export async function getItem(id: string): Promise<EagleItem> {
  console.log(`[HTTP_CLIENT] 获取项目 ${id}`);
  const response = await requestToEaglePlugin<{ success: boolean; data: EagleItem }>('/api/item/' + id);
  if (response.success) {
    return response.data;
  }
  throw new Error(response.error || '获取项目失败');
}

/**
 * 更新项目
 * @param id 项目ID
 * @param data 项目数据
 * @returns Promise<any>
 */
export async function updateItem(id: string, data: Partial<EagleItem>): Promise<any> {
  console.log(`[HTTP_CLIENT] 更新项目 ${id}`);
  return requestToEaglePlugin<any>(`/api/item/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * 创建项目
 * @param data 项目数据
 * @returns Promise<any>
 */
export async function createItem(data: Partial<EagleItem>): Promise<any> {
  console.log('[HTTP_CLIENT] 创建项目');
  return requestToEaglePlugin<any>('/api/items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 删除项目
 * @param id 项目ID
 * @returns Promise<any>
 */
export async function deleteItem(id: string): Promise<any> {
  console.log(`[HTTP_CLIENT] 删除项目 ${id}`);
  return requestToEaglePlugin<any>(`/api/item/${id}`, {
    method: 'DELETE',
  });
}

/**
 * 获取库信息
 * @returns Promise<any>
 */
export async function getLibraryInfo(): Promise<any> {
  console.log('[HTTP_CLIENT] 获取库信息');
  const response = await requestToEaglePlugin<{ success: boolean; data: any }>('/api/library');
  if (response.success) {
    return response.data;
  }
  throw new Error(response.error || '获取库信息失败');
}

/**
 * 同步数据
 * @param data 同步数据
 * @returns Promise<any>
 */
export async function syncData(data: any): Promise<any> {
  console.log('[HTTP_CLIENT] 同步数据');
  return requestToEaglePlugin<any>('/api/sync', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 导出数据
 * @param options 导出选项
 * @returns Promise<any>
 */
export async function exportData(options: any): Promise<any> {
  console.log('[HTTP_CLIENT] 导出数据');
  return requestToEaglePlugin<any>('/api/export', {
    method: 'POST',
    body: JSON.stringify(options),
  });
}

/**
 * 检查服务器是否可用
 * @returns Promise<boolean>
 */
export async function isServerAvailable(): Promise<boolean> {
  try {
    await requestToEaglePlugin('/api/library');
    return true;
  } catch (error) {
    return false;
  }
}