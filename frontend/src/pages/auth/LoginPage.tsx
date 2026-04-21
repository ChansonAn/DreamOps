import React, { useState, useEffect } from 'react';
import { login } from '@/store/features/authSlice';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  // 登录表单状态
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    captcha: '',
  });
  
  // 加载状态
  const [loading, setLoading] = useState(false);
  
  // 错误信息
  const [error, setError] = useState('');

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // 验证码状态
  const [captchaCode, setCaptchaCode] = useState<string>('');

  // 生成验证码
  const generateCaptcha = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
  };

  // 刷新验证码
  const refreshCaptcha = () => {
    generateCaptcha();
  };

  // 组件挂载时生成验证码
  useEffect(() => {
    generateCaptcha();
  }, []);

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 简单表单验证
    if (!formData.username || !formData.password || !formData.captcha) {
      setError('请填写完整信息');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // 验证验证码
      if (formData.captcha.toUpperCase() !== captchaCode) {
        setError('验证码错误，请重新输入');
        generateCaptcha(); // 错误时刷新验证码
        return;
      }
      
      // 调用Redux中的login action
      await dispatch(login(formData)).unwrap();

      // 登录成功后跳转到首页
      navigate('/');
    } catch (err) {
      // 处理登录失败
      setError('用户名或密码错误，请重试');
      generateCaptcha(); // 登录失败时刷新验证码
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans relative overflow-hidden flex">
      {/* 全屏背景渐变 */}
      <div className="fixed inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800"></div>
        {/* 背景渐变叠加层 */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-300/70 to-purple-600/70"></div>
        
        {/* 背景板文字 */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-6 from-blue-400/70 to-purple-800/70 transform translate-x-60">
          <h1 className="text-[clamp(1.75rem,4vw,3rem)] font-bold text-center text-shadow-lg mb-4">AI驱动的IT运维智能管理平台</h1>
          <p className="text-[clamp(0.9rem,1.8vw,1.1rem)] max-w-2xl text-center text-shadow mb-8">
            融入人工智能自动化技术，为您提供高效、专业、智能的运维解决方案
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-xl">
            <div className="flex flex-col items-center p-4 rounded-lg bg-white/10 backdrop-blur-sm">
              <i className="fa fa-cogs text-2xl mb-2"></i>
              <span className="text-center">智能自动化</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-white/10 backdrop-blur-sm">
              <i className="fa fa-bar-chart text-2xl mb-2"></i>
              <span className="text-center">AI数据分析</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-white/10 backdrop-blur-sm">
              <i className="fa fa-shield text-2xl mb-2"></i>
              <span className="text-center">智能安全监控</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-white/10 backdrop-blur-sm">
              <i className="fa fa-bolt text-2xl mb-2"></i>
              <span className="text-center">实时性能优化</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 右侧登录表单区域 */}
        {/* pr-16与最右侧的距离 */}
        <div className="flex-grow flex justify-end items-center p-12 pr-16 relative z-10">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-xl p-8 transform transition-all hover:shadow-2xl">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-4">
              <div className="text-2xl font-bold text-blue-600">DreamOps</div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">欢迎登录</h1>
            <p className="text-gray-500 mt-1">请输入您的账号和密码访问系统</p>
          </div>
          
          {/* 错误提示 */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md animate-fade-in">
              {error}
            </div>
          )}
          
          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                用户名
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-300 group-focus-within:text-blue-600">
                  <i className="fa fa-user text-gray-400 group-focus-within:text-blue-600"></i>
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  placeholder="请输入用户名"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-300 group-focus-within:text-blue-600">
                  <i className="fa fa-lock text-gray-400 group-focus-within:text-blue-600"></i>
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  placeholder="请输入密码"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="captcha" className="block text-sm font-medium text-gray-700">
                验证码
              </label>
              <div className="flex space-x-3">
                <div className="relative group flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-300 group-focus-within:text-blue-600">
                    <i className="fa fa-shield text-gray-400 group-focus-within:text-blue-600"></i>
                  </div>
                  <input
                    type="text"
                    id="captcha"
                    name="captcha"
                    value={formData.captcha}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    placeholder="请输入验证码"
                    disabled={loading}
                  />
                </div>
                <div 
                  className={`w-32 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-200'}`} 
                  onClick={loading ? undefined : refreshCaptcha}
                  style={{
                    background: `linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)`,
                    position: 'relative'
                  }}
                >
                  {/* 验证码文本 */}
                  <span 
                    className="text-xl font-bold tracking-widest"
                    style={{
                      textShadow: '1px 1px 1px rgba(0,0,0,0.1)',
                      transform: 'rotate(-1deg)',
                      background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {captchaCode}
                  </span>
                  {/* 干扰线 */}
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute"
                      style={{
                        height: '2px',
                        background: `rgba(${Math.random() * 100 + 50}, ${Math.random() * 100 + 50}, ${Math.random() * 200 + 55}, 0.5)`,
                        width: '100%',
                        top: `${Math.random() * 100}%`,
                        transform: `rotate(${Math.random() * 45 - 22.5}deg)`,
                        left: '-10%',
                        opacity: 0.5 + Math.random() * 0.5
                      }}
                    />
                  ))}
                  {/* 干扰点 */}
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div 
                      key={`dot-${i}`} 
                      className="absolute rounded-full"
                      style={{
                        height: '2px',
                        width: '2px',
                        background: `rgba(${Math.random() * 100 + 50}, ${Math.random() * 100 + 50}, ${Math.random() * 200 + 55}, 0.7)`,
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        opacity: 0.5 + Math.random() * 0.5
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember-me"
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-transform hover:scale-110"
                  disabled={loading}
                />
                <label htmlFor="remember-me" className="block text-sm text-gray-700 cursor-pointer">
                  记住我
                </label>
              </div>
              <div className="text-sm">
                <button
                  type="button"
                  className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  disabled={loading}
                >
                  忘记密码？
                </button>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                className={`w-full justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    登录中...
                  </div>
                ) : (
                  '登录'
                )}
              </button>
            </div>
          </form>
          
          {/* 底部信息 */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>© 2026 DreamOps IT运维智能管理平台. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
