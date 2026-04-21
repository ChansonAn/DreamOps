import axios from 'axios';
import { message } from 'antd';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('dreamop_auth');
      window.location.href = '/login';
      message.error('登录已过期，请重新登录');
    } else if (error.response?.status === 403) {
      message.error('权限不足');
    } else if (error.response?.status === 500) {
      message.error('服务器内部错误');
    }
    return Promise.reject(error);
  }
);

export { API_BASE_URL };
export default apiClient;
