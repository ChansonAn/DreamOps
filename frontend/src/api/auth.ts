import apiClient from './client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserInfo {
  id: number;
  username: string;
  is_admin: boolean;
}

export interface LoginResponse {
  access_token: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const params = new URLSearchParams();
    params.append('username', data.username);
    params.append('password', data.password);
    const response = await apiClient.post<LoginResponse>('/api/users/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },
  getMe: async (token: string): Promise<UserInfo> => {
    const response = await apiClient.get<UserInfo>('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
