import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  open: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({
    'dashboard': true,
    'asset': false,
    'automation': true,
    'interaction': false,
    'system': false
  });
  const location = useLocation();

  // 切换展开/折叠状态
  const toggleExpand = (key: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 检查当前路径是否匹配给定的路由
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // 检查子菜单中是否有活动项
  const hasActiveChild = (children: string[]) => {
    return children.some(child => location.pathname === child);
  };

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-20 w-64 transform ${open ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out bg-white border-r border-gray-200 h-screen overflow-y-auto`}
    >
      <div className="py-4 px-3">
        {/* 侧边栏导航菜单 */}
        <nav className="space-y-1">
          {/* 仪表盘 */}
          <div>
            <button
              onClick={() => toggleExpand('dashboard')}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-md ${hasActiveChild(['/dashboard']) ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <div className="flex items-center">
                <i className="fa fa-tachometer w-5 h-5 mr-3 text-blue-500"></i>
                <span className={`${open || !hasActiveChild(['/dashboard']) ? 'block' : 'hidden md:block'}`}>仪表盘</span>
              </div>
              <i className={`fa fa-chevron-down text-xs transition-transform duration-200 ${expandedItems.dashboard ? 'transform rotate-180' : ''} ${!open ? 'hidden md:block' : ''}`}></i>
            </button>
            {expandedItems.dashboard && (
              <div className="pl-11 space-y-1 mt-1">
                <Link
                  to="/dashboard"
                  className={`block px-4 py-2 text-sm font-medium rounded-md ${isActive('/dashboard') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  仪表盘
                </Link>
              </div>
            )}
          </div>

          {/* 资产平台 */}
          <div>
            <button
              onClick={() => toggleExpand('asset')}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-md ${hasActiveChild(['/asset-management']) ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <div className="flex items-center">
                <i className="fa fa-database w-5 h-5 mr-3 text-blue-500"></i>
                <span className={`${open || !hasActiveChild(['/asset-management']) ? 'block' : 'hidden md:block'}`}>资产平台</span>
              </div>
              <i className={`fa fa-chevron-down text-xs transition-transform duration-200 ${expandedItems.asset ? 'transform rotate-180' : ''} ${!open ? 'hidden md:block' : ''}`}></i>
            </button>
            {expandedItems.asset && (
              <div className="pl-11 space-y-1 mt-1">
                <Link
                  to="/asset-management"
                  className={`block px-4 py-2 text-sm font-medium rounded-md ${isActive('/asset-management') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  资产管理
                </Link>
              </div>
            )}
          </div>

          {/* 自动化 */}
          <div>
            <button
              onClick={() => toggleExpand('automation')}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-md ${hasActiveChild(['/task-schedules', '/job-templates', '/execution-logs', '/script-library']) ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <div className="flex items-center">
                <i className="fa fa-cogs w-5 h-5 mr-3 text-blue-500"></i>
                <span className={`${open || !hasActiveChild(['/task-schedules', '/job-templates', '/execution-logs', '/script-library']) ? 'block' : 'hidden md:block'}`}>自动化</span>
              </div>
              <i className={`fa fa-chevron-down text-xs transition-transform duration-200 ${expandedItems.automation ? 'transform rotate-180' : ''} ${!open ? 'hidden md:block' : ''}`}></i>
            </button>
            {expandedItems.automation && (
              <div className="pl-11 space-y-1 mt-1">
                <Link
                  to="/task-schedules"
                  className={`block px-4 py-2 text-sm font-medium rounded-md ${isActive('/task-schedules') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  任务编排
                </Link>
                <Link
                  to="/job-templates"
                  className={`block px-4 py-2 text-sm font-medium rounded-md ${isActive('/job-templates') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  作业模板
                </Link>
                <Link
                  to="/script-library"
                  className={`block px-4 py-2 text-sm font-medium rounded-md ${isActive('/script-library') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  脚本管理
                </Link>
                <Link
                  to="/execution-logs"
                  className={`block px-4 py-2 text-sm font-medium rounded-md ${isActive('/execution-logs') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  执行日志
                </Link>
              </div>
            )}
          </div>

          {/* 互动平台 */}
          <div>
            <button
              onClick={() => toggleExpand('interaction')}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-md ${hasActiveChild(['/personal-blog', '/knowledge-base', '/knowledge-qa']) ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <div className="flex items-center">
                <i className="fa fa-comments w-5 h-5 mr-3 text-blue-500"></i>
                <span className={`${open || !hasActiveChild(['/personal-blog', '/knowledge-base', '/knowledge-qa']) ? 'block' : 'hidden md:block'}`}>互动平台</span>
              </div>
              <i className={`fa fa-chevron-down text-xs transition-transform duration-200 ${expandedItems.interaction ? 'transform rotate-180' : ''} ${!open ? 'hidden md:block' : ''}`}></i>
            </button>
            {expandedItems.interaction && (
              <div className="pl-11 space-y-1 mt-1">
                <Link
                  to="/personal-blog"
                  className={`block px-4 py-2 text-sm font-medium rounded-md ${isActive('/personal-blog') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  个人博客
                </Link>
                <Link
                  to="/knowledge-base"
                  className={`block px-4 py-2 text-sm font-medium rounded-md ${isActive('/knowledge-base') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  知识库
                </Link>
                <Link
                  to="/knowledge-qa"
                  className={`block px-4 py-2 text-sm font-medium rounded-md ${isActive('/knowledge-qa') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  知识库问答
                </Link>
              </div>
            )}
          </div>

          {/* 系统管理 */}
          <div>
            <button
              onClick={() => toggleExpand('system')}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-md ${hasActiveChild(['/user-management']) ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <div className="flex items-center">
                <i className="fa fa-server w-5 h-5 mr-3 text-blue-500"></i>
                <span className={`${open || !hasActiveChild(['/user-management']) ? 'block' : 'hidden md:block'}`}>系统管理</span>
              </div>
              <i className={`fa fa-chevron-down text-xs transition-transform duration-200 ${expandedItems.system ? 'transform rotate-180' : ''} ${!open ? 'hidden md:block' : ''}`}></i>
            </button>
            {expandedItems.system && (
              <div className="pl-11 space-y-1 mt-1">
                <Link
                  to="/user-management"
                  className={`block px-4 py-2 text-sm font-medium rounded-md ${isActive('/user-management') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  用户管理
                </Link>
              </div>
            )}
          </div>

        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
