import { requestToBackend } from './httpClient';

/**
 * 推断数据类型
 */
function inferType(value: any): string {
  if (value === null || value === undefined || value === '') {
    return 'text';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  if (typeof value === 'object') {
    return 'object';
  }
  // 尝试解析为数字
  if (!isNaN(Number(value)) && value.trim() !== '') {
    return 'number';
  }
  return 'text';
}

/**
 * 从数据推断 schema
 */
export function inferSchema(items: any[]): any {
  if (!items || items.length === 0) {
    return null;
  }

  const firstItem = items[0];
  const columns = Object.keys(firstItem).map(key => ({
    name: key,
    key: key,
    type: inferType(firstItem[key])
  }));

  return { columns };
}

/**
 * 解析 CSV 文件为动态数据
 */
export function parseCSV(content: string): any[] {
  const lines = content.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) {
    return [];
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const items: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    const item: any = {};

    headers.forEach((header, index) => {
      if (index < values.length) {
        let value: any = values[index];

        // 尝试智能转换类型
        if (value === 'true' || value === 'false') {
          value = value === 'true';
        } else if (!isNaN(Number(value)) && value !== '') {
          value = Number(value);
        } else if (value.includes(';')) {
          // 分号分隔的值转为数组
          value = value.split(';').map((v: string) => v.trim());
        }

        item[header] = value;
      }
    });

    // 确保有唯一 ID
    if (!item.id) {
      item.id = `item_${Date.now()}_${i}`;
    }

    items.push(item);
  }

  return items;
}

/**
 * 解析 JSON 文件
 */
function parseJSON(content: string): any[] {
  try {
    const data = JSON.parse(content);

    if (Array.isArray(data)) {
      return data.map((item, index) => ({
        id: item.id || `item_${Date.now()}_${index}`,
        ...item
      }));
    } else if (typeof data === 'object') {
      return [{
        id: data.id || `item_${Date.now()}_0`,
        ...data
      }];
    }
    return [];
  } catch (error) {
    console.error('JSON解析错误:', error);
    throw new Error('无效的JSON格式');
  }
}

/**
 * 上传文件到后端
 */
export async function uploadFile(
  file: File,
  projectName: string,
  userMapping?: Record<string, string>,
  projectId?: number | null,
  description?: string
): Promise<any> {
  try {
    // 读取文件内容
    const fileContent = await readFileContent(file);

    // 根据文件扩展名解析内容
    let items: any[] = [];
    if (file.name.endsWith('.csv')) {
      items = parseCSV(fileContent);
    } else if (file.name.endsWith('.json')) {
      items = parseJSON(fileContent);
    } else {
      throw new Error('不支持的文件格式。仅支持CSV和JSON文件。');
    }

    // 推断 schema
    const schema = inferSchema(items);

    // 发送到后端
    const body: any = {
      projectName,
      items,
      schema
    };

    if (projectId) {
      body.projectId = projectId;
    }

    if (description) {
      body.description = description;
    }

    const response = await requestToBackend('/api/upload', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    return response;
  } catch (error) {
    console.error('文件上传失败:', error);
    throw error;
  }
}

/**
 * 读取文件内容
 */
function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsText(file);
  });
}

// 导出用于向后兼容的函数（现在这些函数不再需要，但保留接口）
export function autoDetectFieldMapping(headers: string[]): Record<string, number> {
  // 不再需要字段映射，返回空对象
  return {};
}

export function isMappingComplete(mapping: Record<string, number>): boolean {
  // 总是返回 true，因为不再需要映射
  return true;
}