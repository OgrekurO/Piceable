import { getFromBackend } from './httpClient';

/**
 * 从后端获取上传的项目数据
 * @returns 项目数据数组
 */
export async function getUploadedItems() {
  try {
    const response = await getFromBackend('/api/items');
    return response;
  } catch (error) {
    console.error('获取上传的项目数据失败:', error);
    throw error;
  }
}