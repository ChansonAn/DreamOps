import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/store/hooks';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store/store';
import { logout } from '@/store/features/authSlice';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  // 处理登出
  const handleLogout = () => {
    dispatch(logout());
  };

  // 导航到个人资料页面
  const navigateToProfile = () => {
    navigate('/personal-management');
    setDropdownOpen(false);
  };

  // 切换下拉菜单
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // 点击外部关闭下拉菜单
  const handleClickOutside = () => {
    setDropdownOpen(false);
  };

  // 添加事件监听器
  React.useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between p-4">
        {/* 左侧 - Logo和侧边栏切换按钮 */}
        <div className="flex items-center space-x-4">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={toggleSidebar}
          >
            <i className="fa fa-bars text-xl"></i>
          </button>
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-600">DreamOps</div>
          </div>
        </div>

        {/* 右侧 - 工具栏和用户信息 */}
        <div className="flex items-center space-x-4">
          {/* 搜索按钮 */}
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
            <i className="fa fa-search"></i>
          </button>
          
          {/* 通知按钮 */}
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full relative">
            <i className="fa fa-bell-o"></i>
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
          </button>
          
          {/* 用户下拉菜单 */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100"
              onClick={toggleDropdown}
            >
              <div className="relative">
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'admin'}`}
                  alt={user?.name || 'admin'}
                  className="h-8 w-8 rounded-full object-cover border-2 border-transparent hover:border-blue-500 transition-all duration-300"
                  onError={(e) => {
                    // 如果头像加载失败，使用默认头像
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'admin'}`;
                  }}
                  loading="eager"
                />
                {/* 添加轻微的阴影效果增强立体感 */}
                <div className="absolute inset-0 rounded-full shadow-inner opacity-20"></div>
              </div>
              <span className="hidden md:inline-block text-sm font-medium text-gray-700">
                {user?.name || 'admin'}
              </span>
              <i className="fa fa-chevron-down text-xs text-gray-500 transition-transform duration-300" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}></i>
            </button>
            
            {/* 下拉菜单内容 */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <button 
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={navigateToProfile}
                >
                  <i className="fa fa-user mr-2"></i> 个人资料
                </button>
                <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <i className="fa fa-cog mr-2"></i> 设置
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button 
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  <i className="fa fa-sign-out mr-2"></i> 退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
