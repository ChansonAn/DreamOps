import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/api/client';

// 定义用户认证状态类型
interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    name: string;
    avatar: string;
    permissions: string[];
  } | null;
  token: string | null;
  lastActivityTime: number;
  loading: boolean;
  error: string | null;
}

// 从localStorage加载认证状态
const loadAuthState = (): Partial<AuthState> => {
  try {
    // 首先尝试从dreamop_auth对象中获取认证状态
    const serializedAuth = localStorage.getItem('dreamop_auth');
    if (serializedAuth !== null) {
      const parsedState = JSON.parse(serializedAuth);
      // 确保返回的状态包含必要的字段
      const loadedState: Partial<AuthState> = {
        isAuthenticated: !!parsedState.isAuthenticated,
        user: parsedState.user || null,
        token: parsedState.token || null,
        lastActivityTime: parsedState.lastActivityTime || Date.now()
      };
      console.log('Loaded auth state from dreamop_auth:', loadedState);
      return loadedState;
    }
    
    // 如果dreamop_auth不存在，尝试从token键获取token
    const token = localStorage.getItem('token');
    if (token !== null) {
      const loadedState: Partial<AuthState> = {
        token,
        isAuthenticated: true,
        user: null,
        lastActivityTime: Date.now()
      };
      console.log('Loaded auth state from token:', loadedState);
      return loadedState;
    }
    
    console.log('No auth state found in localStorage');
    return {};
  } catch (err) {
    console.error('Failed to load auth state:', err);
    return {};
  }
};

// 保存认证状态到localStorage
const saveAuthState = (state: Partial<AuthState>) => {
  try {
    const serializedAuth = JSON.stringify(state);
    localStorage.setItem('dreamop_auth', serializedAuth);
    
    // 同时保存token到token键，以便api.ts的请求拦截器能够正确获取
    if (state.token) {
      localStorage.setItem('token', state.token);
    }
  } catch (err) {
    console.error('Failed to save auth state:', err);
  }
};

// 初始状态（包含从localStorage加载的状态）
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  lastActivityTime: Date.now(),
  loading: false,
  error: null,
  ...loadAuthState()
}

// 实际登录异步操作
export const login = createAsyncThunk<{
  id: string;
  name: string;
  avatar: string;
  permissions: string[];
  token: string;
}, { username: string; password: string; captcha: string }>(
  'auth/login',
  async (credentials) => {
    try {
      // 调用实际的后端API进行登录，使用表单编码格式
      // 注意：captcha是前端验证，后端不处理，所以只发送username和password
      const loginData = new URLSearchParams();
      loginData.append('username', credentials.username);
      loginData.append('password', credentials.password);
      
      const response = await apiClient.post<{ access_token: string }>('/api/users/login', loginData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const { access_token } = response.data;
      
      // 获取用户信息
      const userDataResponse = await apiClient.get<{ id: number; username: string; is_admin: boolean }>('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      const userData = userDataResponse.data;
      
      return {
        id: userData.id.toString(),
        name: userData.username,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userData.username,
        permissions: userData.is_admin ? ['admin'] : ['user'],
        token: access_token
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
)

// 模拟登出异步操作
export const logout = createAsyncThunk<void>(
  'auth/logout',
  async () => {
    // 实际的API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(undefined);
      }, 300);
    });
  }
);

// 创建authSlice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 添加设置初始认证状态的reducer
    setInitialAuthState: (state, action) => {
      state.isAuthenticated = action.payload.isAuthenticated;
      state.user = action.payload.user;
      state.token = action.payload.token || null;
      state.lastActivityTime = Date.now();
      // 保存更新后的状态到localStorage
      saveAuthState({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        lastActivityTime: state.lastActivityTime
      });
    },
    // 更新最后活动时间
    updateLastActivityTime: (state) => {
      state.lastActivityTime = Date.now();
      // 保存更新后的状态到localStorage
      saveAuthState({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        lastActivityTime: state.lastActivityTime
      });
    },
    // 重置认证状态
    resetAuthState: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.lastActivityTime = Date.now();
      // 清除所有认证相关信息
      localStorage.removeItem('dreamop_auth');
      localStorage.removeItem('token');
    },
    // 同步登出reducer，用于自动登出
    logoutSync: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.lastActivityTime = Date.now();
      // 清除所有认证相关信息
      localStorage.removeItem('dreamop_auth');
      localStorage.removeItem('token');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = {
          id: action.payload.id,
          name: action.payload.name,
          avatar: action.payload.avatar,
          permissions: action.payload.permissions
        };
        state.token = action.payload.token;
        state.lastActivityTime = Date.now();
        // 保存认证状态到localStorage
        saveAuthState({
          isAuthenticated: state.isAuthenticated,
          user: state.user,
          token: state.token,
          lastActivityTime: state.lastActivityTime
        });
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '登录失败';
      })
      .addCase(logout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.lastActivityTime = Date.now();
        // 清除localStorage中的所有认证相关信息
        localStorage.removeItem('dreamop_auth');
        localStorage.removeItem('token');
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '登出失败';
      });
  },
});

// 导出新增的action creator
export const { setInitialAuthState, updateLastActivityTime, resetAuthState, logoutSync } = authSlice.actions;
export default authSlice.reducer;
