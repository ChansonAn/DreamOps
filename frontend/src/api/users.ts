import apiClient from './client';

export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  avatar?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
}

export interface UserUpdateRequest {
  username?: string;
  email?: string;
  password?: string;
  avatar?: string;
  bio?: string;
  is_active?: boolean;
  is_admin?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export const usersApi = {
  list: async (page = 1, pageSize = 10): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get('/api/users', {
      params: { skip: (page - 1) * pageSize, limit: pageSize },
    });
    return response.data;
  },
  get: async (id: number): Promise<User> => {
    const response = await apiClient.get(`/api/users/${id}`);
    return response.data;
  },
  create: async (data: UserCreateRequest): Promise<User> => {
    const response = await apiClient.post('/api/users', data);
    return response.data;
  },
  update: async (id: number, data: UserUpdateRequest): Promise<User> => {
    const response = await apiClient.put(`/api/users/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/users/${id}`);
  },
};
