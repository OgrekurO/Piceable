/**
 * HTTP客户端服务 - 与独立HTTP API服务通信 */

// HTTP客户端 - 用于与独立HTTP API服务通信
const BASE_URL = 'http://localhost:3001';

/**
 * 发送HTTP请求
 * @param endpoint API端点
 * @param options 请求选项
 * @returns Promise
 */
export async function request(endpoint: string, options: RequestInit = {}) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`[HTTP_CLIENT] 发送请求: ${options.method || 'GET'} ${url}`);
    
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
 * GET请求
 * @param endpoint API端点
 * @returns Promise
 */
export function get(endpoint: string) {
  return request(endpoint, { method: 'GET' });
}

/**
 * POST请求
 * @param endpoint API端点
 * @param data 请求数据
 * @returns Promise
 */
export function post(endpoint: string, data: any) {
  return request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT请求 (使用POST方法替代)
 * @param endpoint API端点
 * @param data 请求数据
 * @returns Promise
 */
export function put(endpoint: string, data: any) {
  // 由于Eagle插件API只支持POST方法，这里使用POST替代PUT
  return post(endpoint, data);
}

/**
 * DELETE请求
 * @param endpoint API端点
 * @returns Promise
 */
export function del(endpoint: string) {
  return request(endpoint, { method: 'DELETE' });
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
  return request<EagleItem[]>('/api/items');
}

/**
 * 获取单个项目
 * @param id 项目ID
 * @returns Promise<EagleItem>
 */
export async function getItem(id: string): Promise<EagleItem> {
  console.log(`[HTTP_CLIENT] 获取项目 ${id}`);
  return request<EagleItem>(`/api/item/${id}`);
}

/**
 * 更新项目
 * @param id 项目ID
 * @param data 项目数据
 * @returns Promise<any>
 */
export async function updateItem(id: string, data: Partial<EagleItem>): Promise<any> {
  console.log(`[HTTP_CLIENT] 更新项目 ${id}`);
  return request<any>(`/api/item/${id}`, {
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
  return request<any>('/api/items', {
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
  return request<any>(`/api/item/${id}`, {
    method: 'DELETE',
  });
}

/**
 * 获取库信息
 * @returns Promise<any>
 */
export async function getLibraryInfo(): Promise<any> {
  console.log('[HTTP_CLIENT] 获取库信息');
  return request<any>('/api/library');
}

/**
 * 同步数据
 * @param data 同步数据
 * @returns Promise<any>
 */
export async function syncData(data: any): Promise<any> {
  console.log('[HTTP_CLIENT] 同步数据');
  return request<any>('/api/sync', {
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
  return request<any>('/api/export', {
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
    await request('/api/library');
    return true;
  } catch (error) {
    return false;
  }
}