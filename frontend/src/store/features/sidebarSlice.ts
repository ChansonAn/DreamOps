import { createSlice } from '@reduxjs/toolkit';

// 定义侧边栏状态类型
interface SidebarState {
  isOpen: boolean;
}

// 初始状态
const initialState: SidebarState = {
  isOpen: true,
};

// 创建sidebarSlice
const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isOpen = !state.isOpen;
    },
    openSidebar: (state) => {
      state.isOpen = true;
    },
    closeSidebar: (state) => {
      state.isOpen = false;
    },
  },
});

// 导出actions
export const { toggleSidebar, openSidebar, closeSidebar } = sidebarSlice.actions;

export default sidebarSlice.reducer;
