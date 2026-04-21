import apiClient from './client';

// 定义脚本接口
export interface Script {
  id: string;
  name: string;
  category: string;
  language: string;
  creator: string;
  createTime: string;
  lastUsed: string;
  version: string;
  status: string;
  tags?: string[];
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    default: any;
    description: string;
  }>;
  content?: string;
  description?: string;
}

// 运行脚本请求接口
export interface ScriptRunRequest {
  parameters?: Record<string, any>;
  host?: string;
}

// 运行脚本响应接口
export interface ScriptRunResponse {
  status: string;
  output?: string;
  error?: string;
  executionTime?: number;
}

// 状态映射：后端 enabled/disabled <-> 前端 启用/禁用
const mapStatusFromApi = (s: any) => {
  if (s.status === 'enabled') s.status = '启用';
  else if (s.status === 'disabled') s.status = '禁用';
  return s;
};
const mapStatusToApi = (data: any) => {
  if (data.status === '启用') data.status = 'enabled';
  else if (data.status === '禁用') data.status = 'disabled';
  return data;
};

// 获取脚本列表
export const getScripts = async (): Promise<Script[]> => {
  try {
    const response = await apiClient.get('/api/script');
    return (response.data || []).map(mapStatusFromApi);
  } catch (error) {
    console.error('Error fetching scripts:', error);
    throw error;
  }
};

// 获取单个脚本
export const getScript = async (id: string): Promise<Script> => {
  try {
    const response = await apiClient.get(`/api/script/${id}`);
    return mapStatusFromApi(response.data);
  } catch (error) {
    console.error(`Error fetching script ${id}:`, error);
    throw error;
  }
};

// 创建脚本
export const createScript = async (script: Omit<Script, 'id' | 'createTime' | 'lastUsed'>): Promise<Script> => {
  try {
    const response = await apiClient.post('/api/script', mapStatusToApi({ ...script }));
    return mapStatusFromApi(response.data);
  } catch (error) {
    console.error('Error creating script:', error);
    throw error;
  }
};

// 更新脚本
export const updateScript = async (id: string, script: Partial<Script>): Promise<Script> => {
  try {
    const response = await apiClient.put(`/api/script/${id}`, mapStatusToApi({ ...script }));
    return mapStatusFromApi(response.data);
  } catch (error) {
    console.error(`Error updating script ${id}:`, error);
    throw error;
  }
};

// 删除脚本
export const deleteScript = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/script/${id}`);
  } catch (error) {
    console.error(`Error deleting script ${id}:`, error);
    throw error;
  }
};

// 运行脚本
export const runScript = async (
  id: string, 
  request: ScriptRunRequest
): Promise<ScriptRunResponse> => {
  try {
    const response = await apiClient.post(`/api/script/${id}/run`, request);
    const data = response.data;
    // 将后端的 snake_case 转换为前端的 camelCase
    return {
      status: data.status,
      output: data.output,
      error: data.error,
      executionTime: data.execution_time
    };
  } catch (error) {
    console.error(`Error running script ${id}:`, error);
    throw error;
  }
};
