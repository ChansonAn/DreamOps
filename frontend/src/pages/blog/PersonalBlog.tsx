import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Input, Select, Tag, Avatar, Divider, Empty, Tooltip, Modal, message, Form } from 'antd';
import moment from 'moment';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import MarkdownIt from 'markdown-it';
import { useSelector } from 'react-redux';
import { getBlogs, createBlog, updateBlog, deleteBlog } from '@/api/blog';

// RootState类型定义
interface RootState {
  auth: {
    user: {
      id?: string;
      username?: string;
      avatar?: string;
      permissions?: string[];
    } | null;
    isAuthenticated: boolean;
  };
}

const PersonalBlog: React.FC = () => {
  // 模拟数据加载状态
  const [loading, setLoading] = useState(true);
  
  // 创建Markdown解析器实例
  const mdParser = new MarkdownIt();
  
  // 博客列表数据 - 存储所有博客数据
  const [blogs, setBlogs] = useState<Array<{    id: string;
    title: string;
    content: string;
    author: string;
    avatar: string;
    createTime: string;
    updateTime: string;
    tags: string[];
    views: number;
    likes: number;
    comments: number;
    status: string;
    coverImage?: string; // 新增封面图片字段
    category?: string; // 文章分类字段
    userId?: string; // 文章作者ID
  }>>([]);
  
  // 分页状态 - 仅用于前端展示
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  // 详情模态框状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
  
  // 创建/编辑博客模态框状态
  const [createEditModalVisible, setCreateEditModalVisible] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  // 表单实例
  const [form] = Form.useForm();
  const [commentForm] = Form.useForm();
  
  // 筛选条件状态
  const [filters, setFilters] = useState<{
    title: string;
    author: string;
    tags: string[];
    status: string;
    timeRange: string[];
  }>({
    title: '',
    author: '',
    tags: [],
    status: '',
    timeRange: ['', ''],
  });
  
  // 分类状态
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  // 添加标签状态
  const [tags, setTags] = useState<string[]>([]);
  
  // 获取当前登录用户信息
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const currentUserId = user?.id?.toString();
  
  // 从API获取博客列表
  const fetchBlogs = async () => {
    setLoading(true);
    try {
      // 调用getBlogs函数，获取所有博客数据（不分页）
      const response = await getBlogs({ skip: 0, limit: 10000, is_published: true });
      
      // 将后端返回的authorId映射到前端的userId
      const formattedBlogs = response.blogs.map((blog: any) => ({
        ...blog,
        userId: blog.authorId,
      }));
      setBlogs(formattedBlogs || []);
      
      // 从所有博客列表中提取所有标签并去重
      const allTags = [...new Set(formattedBlogs.flatMap((blog: any) => blog.tags || []))] as string[];
      setTags(allTags);
      
      // 从所有博客列表中提取所有分类并去重
      const allCategories = [...new Set(formattedBlogs.map((blog: any) => blog.category || '其他'))] as string[];
      setCategories(['全部', ...allCategories]);
      
      // 设置总条数为博客数量
      setPagination({ ...pagination, total: formattedBlogs.length });
    } catch (error: any) {
      // 检查是否是认证错误（401）
      if (error.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        // 认证错误由axios拦截器处理，会自动跳转到登录页
        setBlogs([]);
        setTags([]);
        setCategories(['全部']);
        setPagination({ ...pagination, total: 0 });
      } else {
        message.error('获取博客列表失败');
        console.error('Error fetching blogs:', error);
        // 模拟数据作为 fallback
        const mockData = [
        {
          id: '1',
          title: '测试博客1',
          content: '这是一篇测试博客，用于测试博客功能。',
          author: '测试用户1',
          userId: '1', // 添加作者ID
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          createTime: '2023-05-15T10:00:00',
          updateTime: '2023-05-15T11:00:00',
          tags: ['测试', '博客'],
          views: 100,
          likes: 10,
          comments: 5,
          status: '已发布',
          coverImage: 'https://via.placeholder.com/800x400',
          category: '技术',
        },
        {
          id: '2',
          title: '测试博客2',
          content: '这是另一篇测试博客，用于测试博客功能。',
          author: '测试用户2',
          userId: '2', // 添加作者ID
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          createTime: '2023-05-16T14:30:00',
          updateTime: '2023-05-16T15:00:00',
          tags: ['测试', '博客', '技术'],
          views: 50,
          likes: 5,
          comments: 2,
          status: '已发布',
          coverImage: 'https://via.placeholder.com/800x400',
          category: '生活',
        },
        {
          id: '3',
          title: '测试博客3',
          content: '这是第三篇测试博客，用于测试博客功能。',
          author: '测试用户3',
          userId: '3', // 添加作者ID
          avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
          createTime: '2023-05-17T09:15:00',
          updateTime: '2023-05-17T09:30:00',
          tags: ['测试', '博客', '生活'],
          views: 75,
          likes: 7,
          comments: 3,
          status: '草稿',
          coverImage: 'https://via.placeholder.com/800x400',
          category: '技术',
        },
      ];
      setBlogs(mockData);
      setTags([...new Set(mockData.flatMap(blog => blog.tags || []))]);
      setCategories(['全部', ...new Set(mockData.map(blog => blog.category || '其他'))]);
      setPagination({ ...pagination, total: mockData.length });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 初始加载时获取一次博客数据
  useEffect(() => {
    fetchBlogs();
  }, []);
  
  // 分页变更处理
  const handlePageChange = (page: number) => {
    setPagination({
      ...pagination,
      current: page,
    });
  };
  
  // 查看博客详情
  const handleViewDetail = (blog: any) => {
    setSelectedBlog(blog);
    setDetailModalVisible(true);
  };
  
  // 点赞功能
  const handleLike = (id: string) => {
    setBlogs(blogs.map(blog => 
      blog.id === id ? { ...blog, likes: blog.likes + 1 } : blog
    ));
    
    // 如果正在查看的博客被点赞，同步更新
    if (selectedBlog && selectedBlog.id === id) {
      setSelectedBlog({ ...selectedBlog, likes: selectedBlog.likes + 1 });
    }
  };
  
  // 编辑博客
  const handleEdit = (blog: any) => {
    // 权限检查：只有文章作者才能编辑
    if (!isAuthenticated || blog.userId?.toString() !== currentUserId) {
      message.error('您没有权限编辑该博客');
      return;
    }
    
    setEditingBlog(blog);
    setCreateEditModalVisible(true);
  };

  // 当编辑模态框可见且editingBlog存在时，设置表单值
  useEffect(() => {
    if (createEditModalVisible && editingBlog) {
      form.setFieldsValue({
        title: editingBlog.title,
        content: editingBlog.content,
        tags: editingBlog.tags,
        status: editingBlog.status,
        category: editingBlog.category, // 设置分类值
        coverImage: editingBlog.coverImage // 设置封面图片值
      });
    }
  }, [createEditModalVisible, editingBlog, form]);

  // 删除博客
  const handleDelete = (id: string) => {
    // 查找博客对象以检查权限
    const blog = blogs.find(b => b.id === id);
    if (!blog) {
      message.error('博客不存在');
      return;
    }
    
    // 权限检查：只有文章作者才能删除
    if (!isAuthenticated || blog.userId?.toString() !== currentUserId) {
      message.error('您没有权限删除该博客');
      return;
    }
    
    Modal.confirm({
      title: '确定要删除这篇博客吗？',
      content: '删除后将无法恢复，请谨慎操作。',
      onOk: async () => {
        try {
          await deleteBlog(blog.id);
          message.success('博客删除成功');
          setBlogs(blogs.filter(b => b.id !== blog.id));
          setPagination({
            ...pagination,
            total: pagination.total - 1,
          });
        } catch (error: any) {
          // 检查是否是认证错误（401）
          if (error.response?.status === 401) {
            message.error('登录已过期，请重新登录');
            // 认证错误由axios拦截器处理，会自动跳转到登录页
          } else {
            message.error('博客删除失败');
          }
          console.error('Error deleting blog:', error);
        }
      },
    });
  };

  // 创建新博客
  const handleCreate = () => {
    // 检查用户是否登录
    if (!isAuthenticated) {
      message.error('请先登录后再创建博客');
      return;
    }
    
    setEditingBlog(null);
    form.resetFields();
    setCreateEditModalVisible(true);
  };

  // 提交博客（创建或编辑）
  const handleSubmit = async (values: any) => {
    // 先将tags字符串转换为数组
    const tagsArray = typeof values.tags === 'string' 
      ? values.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag)
      : Array.isArray(values.tags) ? values.tags : [];
    
    try {
      if (editingBlog) {
        // 编辑博客
        const updatedBlog = await updateBlog(editingBlog.id, {
          title: values.title,
          content: values.content,
          tags: tagsArray,
          status: values.status,
          category: values.category,
          coverImage: values.coverImage,
        });
        
        message.success('博客更新成功');
        setBlogs(blogs.map(blog => 
          blog.id === editingBlog.id ? updatedBlog : blog
        ));
        
        // 重新计算和更新热门标签列表
        const updatedBlogs = blogs.map(blog => blog.id === editingBlog.id ? updatedBlog : blog);
        const updatedTags = [...new Set(updatedBlogs.flatMap(blog => blog.tags || []))];
        setTags(updatedTags);
      } else {
        // 创建新博客
        const newBlog = await createBlog({
          title: values.title,
          content: values.content,
          tags: tagsArray,
          status: values.status || '草稿',
          category: values.category || '其他',
          coverImage: values.coverImage,
        });
        
        message.success('博客创建成功');
        setBlogs([newBlog, ...blogs]);
        setPagination({
          ...pagination,
          total: pagination.total + 1,
        });
        
        // 更新分类列表
        if (values.category && !categories.includes(values.category) && values.category !== '全部') {
          setCategories([...categories, values.category]);
        }
        
        // 重新计算和更新热门标签列表
        const updatedTags = [...new Set([...tags, ...tagsArray])];
        setTags(updatedTags);
      }
      
      setCreateEditModalVisible(false);
    } catch (error: any) {
      // 检查是否是认证错误（401）
      if (error.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        // 认证错误由axios拦截器处理，会自动跳转到登录页
      } else {
        message.error(editingBlog ? '博客更新失败' : '博客创建失败');
      }
      console.error('Error submitting blog:', error);
    }
  };
  
  // 分类筛选
  const handleCategoryChange = (category: string) => {
    // 直接更新分类状态，不需要重新获取数据，前端会自动过滤
    setSelectedCategory(category);
    // 清除其他筛选条件，只保留分类筛选，类似于热门标签的行为
    setFilters({
      title: '',
      author: '',
      status: '',
      tags: [],
      timeRange: ['', '']
    });
    // 使用函数式更新确保获取最新的pagination状态
      setPagination(prevPagination => ({
        ...prevPagination,
        current: 1
      }));
  };
  
  // 处理标签点击
  const handleTagClick = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: [tag]
    }));
    setPagination(prevPagination => ({
      ...prevPagination,
      current: 1
    }));
  };
  
  // 应用筛选条件过滤博客列表
  const filteredBlogs = blogs.filter(blog => {
    // 分类筛选
    if (selectedCategory !== '全部') {
      const blogCategory = blog.category || '其他';
      if (blogCategory !== selectedCategory) {
        return false;
      }
    }
    
    // 标题筛选
    if (filters.title && !blog.title?.toLowerCase().includes(filters.title.toLowerCase())) {
      return false;
    }
    
    // 作者筛选
    if (filters.author && !blog.author?.toLowerCase().includes(filters.author.toLowerCase())) {
      return false;
    }
    
    // 标签筛选
    if (filters.tags.length > 0) {
      const hasTag = filters.tags.some(tag => blog.tags.includes(tag));
      if (!hasTag) {
        return false;
      }
    }
    
    // 状态筛选
    if (filters.status && blog.status !== filters.status) {
      return false;
    }
    
    // 时间范围筛选
    if (filters.timeRange[0] || filters.timeRange[1]) {
      const blogTime = new Date(blog.createTime);
      if (filters.timeRange[0] && blogTime < new Date(filters.timeRange[0])) {
        return false;
      }
      if (filters.timeRange[1]) {
        const endTime = new Date(filters.timeRange[1]);
        endTime.setHours(23, 59, 59, 999);
        if (blogTime > endTime) {
          return false;
        }
      }
    }
    
    return true;
  });
  
  // 前端分页：根据当前页码和页大小计算显示的博客
  const currentPageBlogs = filteredBlogs.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );
  
  // 渲染博客卡片骨架屏
  const renderBlogSkeleton = () => {
    const skeletons = [];
    for (let i = 0; i < pagination.pageSize; i++) {
      skeletons.push(
        <Col xs={24} key={i} className="mb-4">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full">
            <div className="flex flex-col md:flex-row h-full">
              {/* 左侧图片骨架 */}
              <div className="w-full md:w-1/3 h-40 md:h-auto bg-gray-200 relative">
                <div className="w-24 h-8 bg-gray-300 rounded absolute top-2 left-2 animate-pulse"></div>
                <div className="w-20 h-6 bg-gray-300 rounded-full absolute top-2 right-2 animate-pulse"></div>
              </div>
               
              {/* 右侧内容骨架 */}
              <div className="w-full md:w-2/3 p-4 flex flex-col justify-between">
                <div>
                  <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded mb-3 w-4/5 animate-pulse"></div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                </div>
                 
                {/* 底部信息骨架 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mr-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse mr-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                  </div>
                   
                  {/* 统计数据骨架 */}
                  <div className="flex items-center space-x-3">
                    <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                  </div>
                </div>
                 
                {/* 操作按钮骨架 */}
                <div className="mt-2 flex justify-end space-x-2">
                  <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </Col>
      );
    }
    return skeletons;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">ZS 技术博客</h1>
          <p className="text-xl opacity-90">记录技术成长，分享实战经验</p>
        </div>
      </div>

      {/* 主要内容区域 */}
      {/* 调整界面的宽度 */}
      <div className="max-w-8xl mx-auto px-0 py-8">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* 左侧最新文章区 */}
          <div className="lg:w-[16.666%]">
            {/* 热门标签卡片 */}
            <Card title="热门标签" className="mb-6">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const count = blogs.filter(blog => blog.tags.includes(tag)).length;
                  return (
                    <Tag 
                      key={tag} 
                      color="blue"
                      className="cursor-pointer hover:bg-blue-700"
                      onClick={() => handleTagClick(tag)}
                    >
                      {tag} ({count})
                    </Tag>
                  );
                })}
              </div>
            </Card>
            
            {/* 最新文章卡片 */}
            <Card title="最新文章" className="mb-6">
              <div className="space-y-4">
                {blogs.slice(0, 5).map((blog) => (
                  <div key={blog.id} className="flex gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors" onClick={() => handleViewDetail(blog)}>
                    <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center bg-gradient-to-r from-blue-300 to-purple-300">
                      <span className="text-white font-medium">{blog.title.substring(0, 1)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium line-clamp-2 text-gray-800">{blog.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{moment(blog.createTime).format('MM-DD')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          
          {/* 中间博客列表区 */}
          <div className="lg:w-[60%]">
            {/* 操作栏 */}
            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800">博客列表</h2>
              <Button 
                type="primary" 
                icon={<i className="fa fa-plus mr-1"></i>}
                onClick={handleCreate}
              >
                写博客
              </Button>
            </div>

            {/* 筛选条件 */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-6 transition-all duration-300 border border-gray-100">
              {/* 第一行：标题、作者和状态 */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 min-w-[40px]">标题</label>
                  <Input 
                    placeholder="请输入博客标题" 
                    value={filters.title} 
                    onChange={(e) => setFilters({...filters, title: e.target.value})} 
                    className="w-56 h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                 
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 min-w-[40px]">作者</label>
                  <Input 
                    placeholder="请输入作者姓名" 
                    value={filters.author} 
                    onChange={(e) => setFilters({...filters, author: e.target.value})} 
                    className="w-56 h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                 
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 min-w-[40px]">状态</label>
                  <Select 
                    placeholder="请选择博客状态" 
                    value={filters.status} 
                    onChange={(status) => setFilters({...filters, status})}
                    className="w-56 h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    options={[
                      { label: '已发布', value: '已发布' },
                      { label: '草稿', value: '草稿' }
                    ]}
                    allowClear
                  />
                </div>
              </div>
              
              {/* 第二行：时间范围 */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 min-w-[60px]">时间范围</label>
                  <div className="flex space-x-2">
                    <Input 
                      type="date" 
                      value={filters.timeRange[0]} 
                      onChange={(e) => setFilters({...filters, timeRange: [e.target.value, filters.timeRange[1]]})}
                      placeholder="开始日期"
                      className="w-36 h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    <span className="flex items-center text-gray-500">至</span>
                    <Input 
                      type="date" 
                      value={filters.timeRange[1]} 
                      onChange={(e) => setFilters({...filters, timeRange: [filters.timeRange[0], e.target.value]})}
                      placeholder="结束日期"
                      className="w-36 h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
              
              {/* 第三行：按钮 */}
              <div className="flex justify-end space-x-3 mt-2">
                <Button 
                  onClick={() => {
                    setFilters({title: '', author: '', tags: [], status: '', timeRange: ['', '']});
                    setSelectedCategory('全部');
                    setPagination({...pagination, current: 1});
                  }}
                  className="px-6 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                >
                  重置
                </Button>
                <Button 
                  type="primary" 
                  onClick={() => {
                    // 强制刷新筛选结果的技巧：通过创建新对象触发React重新渲染
                    setFilters({...filters});
                    setPagination({...pagination, current: 1});
                  }}
                  className="px-6 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  查询
                </Button>
              </div>
            </div>

            {/* 博客列表 - 卡片式布局 */}
            {loading ? (
              <Row gutter={[16, 16]}>
                {renderBlogSkeleton()}
              </Row>
            ) : currentPageBlogs.length > 0 ? (
              <Row gutter={[16, 16]}>
                {currentPageBlogs.map((blog) => (
                  <Col xs={24} key={blog.id}>
                    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden h-full">
                      <div className="flex flex-col md:flex-row h-full">
                        {/* 左侧图片区域 */}
                        <div className="w-full md:w-1/3 h-40 md:h-auto bg-gradient-to-r from-blue-500 to-purple-500 relative overflow-hidden">
                          {blog.coverImage ? (
                            <img 
                              src={blog.coverImage} 
                              alt={blog.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-white text-3xl font-bold">
                              {blog.title?.substring(0, 1) || '文'}
                            </div>
                          )}
                          {/* 分类标签 */}
                          <Tag color="blue" className="absolute top-2 left-2 bg-white">
                            {blog.category || '其他'}
                          </Tag>
                          {/* 状态标签 */}
                          <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs ${blog.status === '已发布' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {blog.status}
                          </span>
                        </div>
                          
                        {/* 右侧内容区域 */}
                        <div className="w-full md:w-2/3 p-4 flex flex-col justify-between">
                          <div>
                            <h3 className="text-lg font-semibold mb-2 line-clamp-2 cursor-pointer hover:text-blue-600" onClick={() => handleViewDetail(blog)}>
                              {blog.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {blog.content}
                            </p>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {/* 分类标签放在最左侧 */}
                              <Tag color="blue" className="text-xs">
                                {blog.category || '其他'}
                              </Tag>
                              {/* 然后显示其他标签 */}
                              {blog.tags.map((tag, index) => (
                                <Tag key={index} color="default" className="text-xs">
                                  {tag}
                                </Tag>
                              ))}
                            </div>
                          </div>
                           
                          {/* 底部信息 */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Avatar size="small" src={blog.avatar} />
                              <span className="ml-2 text-sm text-gray-600">{blog.author}</span>
                              <span className="mx-2 text-gray-400">·</span>
                              <span className="text-xs text-gray-500">
                                {moment(blog.createTime).format('YYYY-MM-DD')}
                              </span>
                            </div>
                             
                            {/* 统计数据 */}
                            <div className="flex items-center space-x-3">
                              <span className="flex items-center text-sm text-gray-600">
                                <i className="fa fa-thumbs-up mr-1 text-gray-400"></i>
                                {Number(blog.likes) || 0}
                              </span>
                              <span className="flex items-center text-sm text-gray-600">
                                <i className="fa fa-comment mr-1 text-gray-400"></i>
                                {Number(blog.comments) || 0}
                              </span>
                              <span className="flex items-center text-sm text-gray-600">
                                <i className="fa fa-eye mr-1 text-gray-400"></i>
                                {Number(blog.views) || 0}
                              </span>
                            </div>
                          </div>
                           
                          {/* 操作按钮 */}
                          <div className="flex justify-end space-x-1">
                            <Tooltip title="点赞">
                              <Button 
                                size="small" 
                                type="text" 
                                icon={<i className="fa fa-thumbs-up" />}
                                onClick={() => handleLike(blog.id)}
                              />
                            </Tooltip>
                            <Tooltip title="编辑">
                              <Button 
                                size="small" 
                                type="text" 
                                icon={<i className="fa fa-edit" />}
                                onClick={() => handleEdit(blog)}
                              />
                            </Tooltip>
                            <Tooltip title="删除">
                              <Button 
                                size="small" 
                                type="text" 
                                danger
                                icon={<i className="fa fa-trash text-red-500" />}
                                onClick={() => handleDelete(blog.id)}
                              />
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty description="暂无博客数据" className="py-12" />
            )}

            {/* 分页控件 */}
            {!loading && filteredBlogs.length > 0 && Math.ceil(filteredBlogs.length / pagination.pageSize) > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="inline-flex rounded-md shadow-sm" role="group">
                  <Button
                    type="default"
                    size="small"
                    disabled={pagination.current === 1}
                    onClick={() => handlePageChange(pagination.current - 1)}
                    className="rounded-r-none"
                  >
                    上一页
                  </Button>
                  {Array.from({ length: Math.ceil(filteredBlogs.length / pagination.pageSize) }, (_, i) => i + 1)
                    .slice(Math.max(0, pagination.current - 3), Math.min(Math.ceil(filteredBlogs.length / pagination.pageSize), pagination.current + 2))
                    .map((pageNum) => (
                      <Button
                        key={pageNum}
                        type={pagination.current === pageNum ? 'primary' : 'default'}
                        size="small"
                        onClick={() => handlePageChange(pageNum)}
                        className={`${pageNum === Math.min(Math.ceil(filteredBlogs.length / pagination.pageSize), pagination.current + 2) ? 'rounded-l-none' : ''} ${pageNum === Math.max(0, pagination.current - 3) ? 'rounded-r-none' : ''}`}
                      >
                        {pageNum}
                      </Button>
                    ))}
                  <Button
                    type="default"
                    size="small"
                    disabled={pagination.current === Math.ceil(filteredBlogs.length / pagination.pageSize)}
                    onClick={() => handlePageChange(pagination.current + 1)}
                    className="rounded-l-none"
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 右侧边栏 */}
          <div className="lg:w-[23.334%]">
            {/* 作者信息卡片 */}
            <Card className="mb-6 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-24"></div>
              <div className="flex flex-col items-center -mt-12">
                <Avatar size={64} className="border-4 border-white" src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
                <h3 className="text-lg font-semibold mt-3">ZS 技术博客</h3>
                <p className="text-gray-600 text-sm mt-1">分享技术，记录成长</p>
                <div className="flex space-x-4 mt-4 w-full justify-center">
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">{blogs.length}</div>
                    <div className="text-xs text-gray-500">文章</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">{blogs.reduce((sum, blog) => sum + blog.views, 0)}</div>
                    <div className="text-xs text-gray-500">浏览</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">{blogs.reduce((sum, blog) => sum + blog.likes, 0)}</div>
                    <div className="text-xs text-gray-500">点赞</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 分类统计 */}
            <Card title="文章分类统计" className="mb-6">
              <div className="space-y-3">
                {categories.slice(1).map((category) => {
                  // 使用原始博客数据计算分类计数，不受筛选条件影响
                  const count = blogs.filter(blog => {
                    const blogCategory = blog.category || '其他';
                    return blogCategory === category;
                  }).length;
                  // 使用过滤后的博客数据计算百分比，反映当前筛选条件下的分布
                  const filteredCount = filteredBlogs.filter(blog => {
                    const blogCategory = blog.category || '其他';
                    return blogCategory === category;
                  }).length;
                  const percentage = filteredBlogs.length > 0 ? Math.round((filteredCount / filteredBlogs.length) * 100) : 0;
                  // 检查当前分类是否被选中
                  const isSelected = selectedCategory === category;
                  return (
                    <div key={category} className={`cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors ${isSelected ? 'bg-blue-50' : ''}`} onClick={() => handleCategoryChange(category)}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-sm ${isSelected ? 'text-blue-700 font-medium' : ''}`}>{category}</span>
                        <span className="text-xs text-gray-500">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`${isSelected ? 'bg-blue-600' : 'bg-blue-600'} h-1.5 rounded-full transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* 博客详情模态框 */}
      <Modal
        title={selectedBlog?.title}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={null}
      >
        {selectedBlog && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center">
                <Avatar size={48} src={selectedBlog.avatar} />
                <div className="ml-3">
                  <p className="font-medium">{selectedBlog.author}</p>
                  <p className="text-sm text-gray-500">
                    发布于: {selectedBlog.createTime} {selectedBlog.updateTime !== selectedBlog.createTime && `| 更新于: ${selectedBlog.updateTime}`}
                  </p>
                </div>
              </div>
              <div className="flex space-x-4">
                <span className="flex items-center text-gray-500">
                  <i className="fa fa-eye mr-1"></i>
                  {selectedBlog.views}
                </span>
                <span className="flex items-center text-gray-500">
                  <i className="fa fa-thumbs-up mr-1"></i>
                  {selectedBlog.likes}
                </span>
                <span className="flex items-center text-gray-500">
                  <i className="fa fa-comment mr-1"></i>
                  {selectedBlog.comments}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${selectedBlog.status === '已发布' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {selectedBlog.status}
                </span>
              </div>
            </div>
            
            {/* 标签 */}
            <div className="flex flex-wrap gap-2">
              {selectedBlog.tags.map((tag: string, index: number) => (
                <Tag key={index} color="blue">
                  {tag}
                </Tag>
              ))}
            </div>
            
            {/* 内容 */}
            <div className="blog-content max-w-none">
              <div dangerouslySetInnerHTML={{ __html: mdParser.render(selectedBlog.content || '') }} />
            </div>
            
            <Divider />
            
            {/* 操作按钮 */}
            <div className="flex justify-between">
              <div className="flex space-x-2">
                <Button 
                  type="link" 
                  icon={<i className="fa fa-thumbs-up"></i>}
                  onClick={() => handleLike(selectedBlog.id)}
                >
                  点赞 ({selectedBlog.likes})
                </Button>
                <Button 
                  type="link" 
                  icon={<i className="fa fa-comment"></i>}
                >
                  评论 ({selectedBlog.comments})
                </Button>
                <Button 
                  type="link" 
                  icon={<i className="fa fa-share-alt"></i>}
                >
                  分享
                </Button>
              </div>
              <div>
                <Button 
                  onClick={() => {
                    setDetailModalVisible(false);
                    setTimeout(() => handleEdit(selectedBlog), 300);
                  }}
                >
                  编辑
                </Button>
              </div>
            </div>
            
            {/* 评论区 */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">评论 ({selectedBlog.comments})</h3>
              <div className="space-y-4">
                {selectedBlog.comments > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Avatar size={32} src="https://api.dicebear.com/7.x/avataaars/svg?seed=user1" />
                      <span className="ml-2 font-medium">用户1</span>
                      <span className="ml-2 text-xs text-gray-500">2023-05-20 15:30:25</span>
                    </div>
                    <p className="mt-2 text-gray-700">
                      非常感谢分享，学到了很多实用技巧！
                    </p>
                  </div>
                )}
                
                {/* 评论表单 */}
                <Form form={commentForm} layout="vertical" onFinish={() => console.log('Comment submitted')}>
                  <Form.Item label="添加评论" name="commentContent">
                    <Input.TextArea rows={3} placeholder="请输入您的评论" />
                  </Form.Item>
                  <Form.Item>
                    <div className="flex justify-end">
                      <Button type="primary" htmlType="submit">提交评论</Button>
                    </div>
                  </Form.Item>
                </Form>
              </div>
            </div>
          </div>
        )}
      </Modal>
      
      {/* 创建/编辑博客模态框 */}
      <Modal
        title={editingBlog ? "编辑博客" : "写博客"}
        open={createEditModalVisible}
        onCancel={() => setCreateEditModalVisible(false)}
        footer={null}
        width={1000}
      >
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleSubmit}
          labelCol={{ xs: { span: 4 } }}
          wrapperCol={{ xs: { span: 20 } }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="标题"
                name="title"
                rules={[
                  { required: true, message: '请输入博客标题' },
                  { min: 5, message: '标题至少5个字符' },
                ]}
                labelCol={{ xs: { span: 3 } }}
                wrapperCol={{ xs: { span: 21 } }}
              >
                <Input placeholder="请输入博客标题" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              {/* 新增封面图片上传字段 */}
              <Form.Item
                label="封面图片"
                name="coverImage"
                labelCol={{ xs: { span: 6 } }}
                wrapperCol={{ xs: { span: 18 } }}
              >
                <Input.TextArea 
                  placeholder="请输入封面图片URL，或留空使用默认样式"
                  rows={1}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="状态"
                name="status"
                rules={[{ required: true, message: '请选择博客状态' }]}
                labelCol={{ xs: { span: 6 } }}
                wrapperCol={{ xs: { span: 18 } }}
              >
                <Select>
                  <Select.Option value="草稿">草稿</Select.Option>
                  <Select.Option value="已发布">已发布</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="文章分类"
                name="category"
                rules={[{ required: true, message: '请选择文章分类' }]}
                labelCol={{ xs: { span: 6 } }}
                wrapperCol={{ xs: { span: 18 } }}
              >
                <Select>
                  <Select.Option value="日常生活">日常生活</Select.Option>
                  <Select.Option value="自动化管理">自动化管理</Select.Option>
                  <Select.Option value="国产数据库">国产数据库</Select.Option>
                  <Select.Option value="国外数据库">国外数据库</Select.Option>
                  <Select.Option value="非全MEM">非全MEM</Select.Option>
                  <Select.Option value="其他">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="标签"
                name="tags"
                rules={[{ required: true, message: '请至少添加一个标签' }]}
                labelCol={{ xs: { span: 6 } }}
                wrapperCol={{ xs: { span: 18 } }}
              >
                <Input.TextArea placeholder="请输入标签，用逗号分隔" 
                rows={1} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="内容"
            name="content"
            rules={[
              { required: true, message: '请输入博客内容' },
              { min: 20, message: '内容至少20个字符' },
            ]}
            labelCol={{ xs: { span: 3 } }}
            wrapperCol={{ xs: { span: 21 } }}
          >
            <MdEditor 
            style={{ height: '500px' }} 
            renderHTML={(text) => mdParser.render(text)} 
            value={form.getFieldValue('content') || ''}
            onChange={(data) => {
              form.setFieldValue('content', data.text);
              // 添加这行代码，在更新值后手动触发验证
              form.validateFields(['content']);
            }}         
          />
          </Form.Item>
          
          <Form.Item wrapperCol={{ xs: { span: 24 } }}>
            <div className="flex justify-end">
              <Button onClick={() => setCreateEditModalVisible(false)} className="mr-2">
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingBlog ? "更新" : "发布"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 自定义样式 */}
      <style>{`
        .blog-detail-modal .ant-modal-content {
          border-radius: 12px;
          overflow: hidden;
        }
        
        .blog-edit-modal .ant-modal-content {
          border-radius: 12px;
        }
        
        .blog-detail-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .animate-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        /* 日期输入框样式优化 */
        
        /* Markdown 内容样式 */
        .blog-content h1 { font-size: 1.75rem; font-weight: 700; margin: 1.2em 0 0.6em; padding-bottom: 0.3em; border-bottom: 1px solid #e5e7eb; color: #111827; }
        .blog-content h2 { font-size: 1.4rem; font-weight: 600; margin: 1em 0 0.5em; padding-bottom: 0.25em; border-bottom: 1px solid #e5e7eb; color: #1f2937; }
        .blog-content h3 { font-size: 1.2rem; font-weight: 600; margin: 0.8em 0 0.4em; color: #374151; }
        .blog-content h4 { font-size: 1.05rem; font-weight: 600; margin: 0.6em 0 0.3em; color: #4b5563; }
        .blog-content h5, .blog-content h6 { font-size: 1rem; font-weight: 600; margin: 0.5em 0 0.3em; color: #6b7280; }
        .blog-content p { margin: 0.6em 0; line-height: 1.75; color: #374151; }
        .blog-content ul, .blog-content ol { margin: 0.6em 0; padding-left: 1.8em; }
        .blog-content li { margin: 0.25em 0; line-height: 1.7; color: #374151; }
        .blog-content ul li { list-style-type: disc; }
        .blog-content ol li { list-style-type: decimal; }
        .blog-content blockquote { border-left: 4px solid #6366f1; background: #f0f0ff; padding: 0.6em 1em; margin: 0.8em 0; border-radius: 0 6px 6px 0; color: #4b5563; }
        .blog-content pre { background: #1e293b; color: #e2e8f0; padding: 1em; border-radius: 8px; overflow-x: auto; margin: 0.8em 0; font-size: 0.875rem; line-height: 1.6; }
        .blog-content code { font-family: 'Fira Code', 'Consolas', 'Monaco', monospace; font-size: 0.9em; }
        .blog-content :not(pre) > code { background: #f1f5f9; color: #e11d48; padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.85em; }
        .blog-content table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
        .blog-content th, .blog-content td { border: 1px solid #d1d5db; padding: 0.5em 0.8em; text-align: left; }
        .blog-content th { background: #f3f4f6; font-weight: 600; color: #1f2937; }
        .blog-content a { color: #4f46e5; text-decoration: underline; }
        .blog-content hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5em 0; }
        .blog-content img { max-width: 100%; border-radius: 6px; margin: 0.6em 0; }
        .blog-content strong { font-weight: 700; color: #111827; }
        .blog-content em { font-style: italic; }
        
        input[type="date"] {
          font-family: inherit;
          background-color: white;
          cursor: pointer;
        }
        
        input[type="date"]:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }
        
        /* 筛选条件区域样式优化 */
        .ant-input:hover,
        .ant-select:hover {
          border-color: #1890ff;
          transition: all 0.3s;
        }
      `}</style>
    </div>
  );
};

export default PersonalBlog;
