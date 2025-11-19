/**
 * 与Eagle插件通信的服务模块
 * 使用HTTP API进行通信
 */

import { getFromEaglePlugin as get, postToEaglePlugin as post, putToEaglePlugin as put } from './httpClient';

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
          console.log('[PLUGIN_COMM] 项目数据格式正确，数组长度:', response.data.length);
          // 检查前几个项目的thumbnail字段
          console.log('[PLUGIN_COMM] 前3个项目thumbnail字段:', 
            response.data.slice(0, 3).map((item: any) => ({
              id: item.id,
              thumbnail: item.thumbnail,
              thumbnailType: typeof item.thumbnail
            })));
          return response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          // 如果response.data.data是数组（嵌套结构）
          console.log('[PLUGIN_COMM] 项目数据格式为嵌套结构，数组长度:', response.data.data.length);
          // 检查前几个项目的thumbnail字段
          console.log('[PLUGIN_COMM] 前3个项目thumbnail字段:', 
            response.data.data.slice(0, 3).map((item: any) => ({
              id: item.id,
              thumbnail: item.thumbnail,
              thumbnailType: typeof item.thumbnail
            })));
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
 * 请求获取单个项目
 * @param id 项目ID
 * @returns Promise<EagleItem>
 */
export async function getItem(id: string): Promise<EagleItem> {
  try {
    console.log(`[PLUGIN_COMM] 获取项目，ID: ${id}`);
    
    if (currentMethod === CommunicationMethod.HttpApi) {
      const response = await get(`/api/v1/item/${id}`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || '获取项目失败');
      }
    } else {
      throw new Error('不支持的通信方式');
    }
  } catch (error) {
    console.error(`[PLUGIN_COMM] 获取项目失败，ID: ${id}:`, error);
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