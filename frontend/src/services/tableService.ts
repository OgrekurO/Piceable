import { requestToBackend } from './httpClient';
import type { Table, ProjectSchema } from '../types/schema';

/**
 * 获取项目下的所有表格
 * @param projectId 项目ID
 * @returns 表格列表
 */
export async function getTables(projectId: number): Promise<Table[]> {
  try {
    const response = await requestToBackend(`/api/projects/${projectId}/tables`, {
      method: 'GET'
    });
    return response;
  } catch (error) {
    console.error('获取表格列表失败:', error);
    throw error;
  }
}

/**
 * 为项目创建新表格
 * @param projectId 项目ID
 * @param name 表格名称
 * @param schema 表格Schema
 * @param description 表格描述
 * @returns 创建的表格
 */
export async function createTable(
  projectId: number,
  name: string,
  schema: ProjectSchema | null,
  description?: string
): Promise<Table> {
  try {
    const tableData = { name, schema, description };
    const response = await requestToBackend(`/api/projects/${projectId}/tables`, {
      method: 'POST',
      body: JSON.stringify(tableData)
    });
    return response;
  } catch (error) {
    console.error('创建表格失败:', error);
    throw error;
  }
}