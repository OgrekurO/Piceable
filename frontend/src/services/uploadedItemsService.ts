import { requestToBackend } from './httpClient';

/**
 * 从后端获取上传的项目数据
 * @returns 项目数据数组
 */
export async function getUploadedItems(projectId?: number, tableId?: number): Promise<any[]> {
  try {
    let url = '/api/items';
    const params = new URLSearchParams();

    if (projectId) {
      params.append('projectId', projectId.toString());
    }

    if (tableId) {
      params.append('tableId', tableId.toString());
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await requestToBackend(url);
    return response;
  } catch (error) {
    console.error('获取上传的项目数据失败:', error);
    throw error;
  }
}