import { requestToBackend } from './httpClient';

import type { ProjectSchema } from '../types/schema';

export interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  last_modified: string;
  user_id: number;
  items_count: number;
  schema?: ProjectSchema;
  source_type?: string;
  source_metadata?: {
    library_path?: string;
    [key: string]: any;
  };
  tables?: any[];
}

/**
 * 项目更新事件监听器
 */
type ProjectUpdateListener = () => void;
const projectUpdateListeners: ProjectUpdateListener[] = [];

/**
 * 注册项目更新监听器
 * @param listener 监听器函数
 * @returns 取消监听的函数
 */
export function onProjectUpdate(listener: ProjectUpdateListener): () => void {
  projectUpdateListeners.push(listener);
  return () => {
    const index = projectUpdateListeners.indexOf(listener);
    if (index !== -1) {
      projectUpdateListeners.splice(index, 1);
    }
  };
}

/**
 * 触发项目更新事件
 */
function notifyProjectUpdate() {
  projectUpdateListeners.forEach(listener => listener());
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
 * 获取单个项目详情
 * @param projectId 项目ID
 * @returns 项目详情
 */
export async function getProject(projectId: number): Promise<Project> {
  try {
    const response = await requestToBackend(`/api/projects/${projectId}`, {
      method: 'GET'
    });
    return response;
  } catch (error) {
    console.error('获取项目详情失败:', error);
    throw error;
  }
}

/**
 * 创建新项目
 * @param name 项目名称
 * @param description 项目描述（可选）
 * @param schema 项目 Schema（可选）
 * @returns 创建的项目
 */
export async function createProject(name: string, description?: string, schema?: ProjectSchema): Promise<Project> {
  try {
    // Assuming 'post' is a helper function that wraps requestToBackend and handles success/error structure
    // For this change, we'll adapt to the existing requestToBackend structure.
    const projectData = { name, description, schema };
    const response = await requestToBackend('/api/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
    // The provided edit assumes a response structure like { success: boolean, data?: Project, error?: string }
    // Adapting to the original requestToBackend which directly returns the data on success or throws on error.
    notifyProjectUpdate(); // 触发更新通知
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
    // Assuming 'del' is a helper function that wraps requestToBackend and handles success/error structure
    // For this change, we'll adapt to the existing requestToBackend structure.
    const response = await requestToBackend(`/api/projects/${projectId}`, {
      method: 'DELETE'
    });
    // The provided edit assumes a response structure like { success: boolean, data?: any, error?: string }
    // Adapting to the original requestToBackend which directly returns the data on success or throws on error.
    notifyProjectUpdate(); // 触发更新通知
    return response; // Original function returns 'any', new one returns 'boolean'. Sticking to original return type for now.
  } catch (error) {
    console.error('删除项目失败:', error);
    throw error;
  }
}