/**
 * 项目类型定义文件
 */
export type { DataRecord, Annotation, SearchResult } from './map.ts'
export type { User } from './user.ts'

// 角色信息
export interface Role {
  id: number;
  name: string;
  description: string;
}

// 图像同步状态
export interface ImageSyncStatus {
  id: number;
  eagleId: string;
  lastSyncTime: string; // ISO格式时间字符串
  userId: number;
  status: 'pending' | 'synced' | 'error';
}

// 属性结构
export interface AttributeStructure {
  id: number;
  name: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'MULTI';
  options?: string; // JSON字符串
  parentId?: number;
  userId: number;
  children?: AttributeStructure[];
}

// 图像属性值
export interface ImageAttributeValue {
  id: number;
  eagleId: string;
  attributeId: number;
  valueJson: string; // JSON字符串
}

// Eagle文件夹信息
export interface EagleFolder {
  id: string;
  name: string;
  children?: EagleFolder[];
}

// Eagle项目信息
export interface EagleItem {
  id: string;
  name: string;
  folders: string[]; // 文件夹ID列表
  tags: string[];
  annotation: string;
  url: string;
  lastModified: number; // 时间戳
  thumbnail?: string; // 缩略图URL
}

// 库信息
export interface LibraryInfo {
  id: string;
  name: string;
  path: string; // 库路径
  folders: EagleFolder[];
  items: EagleItem[];
  itemsCount: number; // 项目数量
}