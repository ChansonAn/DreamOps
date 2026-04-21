import apiClient, { API_BASE_URL } from './client';

export interface FileRecord {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  chunk_count: number;
  upload_time: string;
  status: 'success' | 'failed';
  content_preview?: string;
}

export interface KnowledgeStats {
  total_chunks: number;
  collection_name: string;
  collections?: any[];
}

export interface KnowledgeResult {
  content: string;
  metadata: any;
  distance: number;
  keyword_score?: number;
  final_score?: number;
}

export interface KnowledgeQueryResponse {
  results: KnowledgeResult[];
}

export const knowledgeApi = {
  getStats: async (): Promise<{ code: number; data: KnowledgeStats }> => {
    const response = await apiClient.get('/api/knowledge/stats');
    return response.data;
  },
  getFiles: async (): Promise<{ code: number; data: FileRecord[] }> => {
    const response = await apiClient.get('/api/knowledge/files');
    return response.data;
  },
  uploadAndBuild: async (file: File): Promise<{ code: number; msg: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/api/knowledge/upload-and-build', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return response.data;
  },
  downloadFile: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/knowledge/files/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
  deleteFile: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/knowledge/files/${id}`);
  },
  query: async (query: string, topK = 5): Promise<{ code: number; data: KnowledgeQueryResponse }> => {
    const response = await apiClient.get('/api/knowledge/query', {
      params: { query, top_k: topK },
    });
    return response.data;
  },
};

export { API_BASE_URL };
