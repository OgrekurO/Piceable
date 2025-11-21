import { requestToBackend } from './httpClient';

export interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  last_modified: string;
  user_id: number;
  items_count: number;
}

/**
 * 获取用户的所有项目
 * @returns 项目列表
 */
export async function getProjects(): Promise<Project[]> {
  try {
    const response = await requestToBackend('/api/projects', {
      method: 'GET'
    });
    return response;
  } catch (error) {
    console.error('获取项目列表失败:', error);
    throw error;
  }
}

/**
 * 创建新项目
 * @param name 项目名称
 * @param description 项目描述（可选）
 * @returns 创建的项目
 */
export async function createProject(name: string, description?: string): Promise<Project> {
  try {
    const response = await requestToBackend('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description })
    });
    return response;
  } catch (error) {
    console.error('创建项目失败:', error);
    throw error;
  }
}

/**
 * 删除项目
 * @param projectId 项目ID
 * @returns 删除结果
 */
export async function deleteProject(projectId: number): Promise<any> {
  try {
    const response = await requestToBackend(`/api/project/${projectId}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    console.error('删除项目失败:', error);
    throw error;
  }
}