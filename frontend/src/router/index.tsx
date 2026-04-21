import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import LoginPage from '@/pages/auth/LoginPage';

// Lazy loaded pages
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));
const UserManagement = lazy(() => import('@/pages/user/UserManagement'));
const AssetManagement = lazy(() => import('@/pages/asset/AssetManagement'));
const ScriptLibrary = lazy(() => import('@/pages/automation/ScriptLibrary'));
const JobTemplates = lazy(() => import('@/pages/automation/JobTemplates'));
const TaskSchedules = lazy(() => import('@/pages/automation/TaskSchedules'));
const JobManagement = lazy(() => import('@/pages/automation/JobManagement'));
const ExecutionLogs = lazy(() => import('@/pages/automation/ExecutionLogs'));
const KnowledgeBase = lazy(() => import('@/pages/knowledge/KnowledgeBase'));
const KnowledgeQA = lazy(() => import('@/pages/knowledge/KnowledgeQA'));
const PersonalBlog = lazy(() => import('@/pages/blog/PersonalBlog'));

const Loading = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="/asset-management" element={<AssetManagement />} />
          <Route path="/script-library" element={<ScriptLibrary />} />
          <Route path="/job-templates" element={<JobTemplates />} />
          <Route path="/task-schedules" element={<TaskSchedules />} />
          <Route path="/job-management" element={<JobManagement />} />
          <Route path="/execution-logs" element={<ExecutionLogs />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          <Route path="/knowledge-qa" element={<KnowledgeQA />} />
          <Route path="/personal-blog" element={<PersonalBlog />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
