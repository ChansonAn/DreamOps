import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import sidebarReducer from './features/sidebarSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  sidebar: sidebarReducer,
});
