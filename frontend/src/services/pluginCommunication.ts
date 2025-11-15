/**
 * 与Eagle插件通信的服务模块
 * 使用HTTP API进行通信
 */

import { get, post, put } from './httpClient';

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

// 定义库信息类型
export interface LibraryInfo {
  name: string;
  path: string;
  itemsCount: number;
}

// 通信方式枚举
export enum CommunicationMethod {
  HttpApi = 'httpapi'
}

// 当前通信方式
let currentMethod: CommunicationMethod = CommunicationMethod.HttpApi;

/**
 * 设置通信方式
 * @param method 通信方式
 */
export function setCommunicationMethod(method: CommunicationMethod): void {
  currentMethod = method;
  console.log(`[PLUGIN_COMM] 通信方式已设置为: ${method}`);
}

/**
 * 请求获取库信息
 * @returns Promise<LibraryInfo>
 */
export async function getLibraryInfo(): Promise<LibraryInfo> {
  try {
    console.log('[PLUGIN_COMM] 获取库信息');
    
    if (currentMethod === CommunicationMethod.HttpApi) {
      const response = await get('/api/v1/library');
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || '获取库信息失败');
      }
    } else {
      throw new Error('不支持的通信方式');
    }
  } catch (error) {
    console.error('[PLUGIN_COMM] 获取库信息失败:', error);
    throw error;
  }
}

/**
 * 请求获取项目列表
 * @returns Promise<EagleItem[]>
 */
export async function getItems(): Promise<EagleItem[]> {
  try {
    console.log('[PLUGIN_COMM] 获取项目列表');
    
    if (currentMethod === CommunicationMethod.HttpApi) {
      const response = await get('/api/v1/items');
      console.log('[PLUGIN_COMM] API响应结构:', response);
      
      if (response.success) {
        // 根据实际API响应结构调整
        // API返回格式: { success: true, count: number, data: EagleItem[] }
        if (response.data && Array.isArray(response.data)) {
          // 如果response.data本身就是数组
          return response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          // 如果response.data.data是数组（嵌套结构）
          return response.data.data;
        } else {
          // 如果没有数据或数据格式不正确
          console.warn('[PLUGIN_COMM] 项目数据格式不正确或为空');
          return [];
        }
      } else {
        throw new Error(response.error || '获取项目列表失败');
      }
    } else {
      throw new Error('不支持的通信方式');
    }
  } catch (error) {
    console.error('[PLUGIN_COMM] 获取项目列表失败:', error);
    throw error;
  }
}

/**
 * 请求更新项目
 * @param itemData 项目数据
 * @returns Promise<boolean>
 */
export async function updateItem(itemData: EagleItem): Promise<boolean> {
  try {
    console.log('[PLUGIN_COMM] 更新项目:', itemData);
    
    if (currentMethod === CommunicationMethod.HttpApi) {
      const response = await put(`/api/v1/item/${itemData.id}`, itemData);
      if (response.success) {
        return true;
      } else {
        throw new Error(response.error || '更新项目失败');
      }
    } else {
      throw new Error('不支持的通信方式');
    }
  } catch (error) {
    console.error('[PLUGIN_COMM] 更新项目失败:', error);
    throw error;
  }
}

/**
 * 请求同步数据到Eagle
 * @param data 要同步的数据
 * @returns Promise<boolean>
 */
export async function syncDataToEagle(data: Record<string, any>): Promise<boolean> {
  try {
    console.log('[PLUGIN_COMM] 同步数据:', data);
    
    if (currentMethod === CommunicationMethod.HttpApi) {
      const response = await post('/api/v1/sync', data);
      if (response.success) {
        return true;
      } else {
        throw new Error(response.error || '同步数据失败');
      }
    } else {
      throw new Error('不支持的通信方式');
    }
  } catch (error) {
    console.error('[PLUGIN_COMM] 同步数据失败:', error);
    throw error;
  }
}

/**
 * 请求导出数据
 * @param format 导出格式
 * @returns Promise<any>
 */
export async function exportData(format: string): Promise<Record<string, any>> {
  try {
    console.log('[PLUGIN_COMM] 导出数据:', { format });
    
    if (currentMethod === CommunicationMethod.HttpApi) {
      const response = await post('/api/v1/export', { format });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || '导出数据失败');
      }
    } else {
      throw new Error('不支持的通信方式');
    }
  } catch (error) {
    console.error('[PLUGIN_COMM] 导出数据失败:', error);
    throw error;
  }
}

/**
 * 检查HTTP服务器是否可用
 * @returns Promise<boolean>
 */
export async function isHttpServerAvailable(): Promise<boolean> {
  try {
    console.log('[PLUGIN_COMM] 检查HTTP服务器是否可用');
    
    // 使用统一的HTTP客户端检查健康状态
    const response = await get('/api/v1/health');
    const isAvailable = response.success;
    console.log(`[PLUGIN_COMM] HTTP服务器可用性检查结果: ${isAvailable}`);
    return isAvailable;
  } catch (error) {
    console.log('[PLUGIN_COMM] HTTP服务器不可用:', error);
    return false;
  }
}
