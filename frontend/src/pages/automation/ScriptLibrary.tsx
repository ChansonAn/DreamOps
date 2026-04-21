import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { useSelector } from 'react-redux';
import DataTable from '@/components/common/DataTable';
import Modal from '@/components/common/Modal';
import { getScripts, createScript, updateScript, deleteScript, runScript, ScriptRunRequest, ScriptRunResponse } from '@/api/scripts';
import { getConfigItems } from '@/api/cmdb';
import { createExecutionLog, completeExecutionLog } from '@/api/automation';

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

// 定义Host类型接口，基于CMDB中的主机配置项
interface Host {
  id: string;
  name: string;
  ip: string;
  hostname: string;
  os: string;
  cpu: number;
  memory: number;
  disk: number;
  status: string;
  environment: string;
  businessLine: string;
  tags: string[];
  type?: string; // 添加类型字段
}

const ScriptLibrary: React.FC = () => {
  // 模拟数据加载状态
  const [loading, setLoading] = useState(true);
  
  // 获取当前登录用户信息
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const currentUserName = user?.username || '未知用户';

  // 模拟脚本列表数据
  const [scripts, setScripts] = useState<Array<{id: string;
    name: string;
    category: string;
    language: string;
    creator: string;
    createTime: string;
    lastUsed: string;
    version: string;
    status: string;
    tags?: string[];
    parameters?: Array<{name: string; type: string; required: boolean; default: any; description: string}>;
  }>>([]);
  
  // 多选状态管理
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(new Set());

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 详情模态框状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedScript, setSelectedScript] = useState<any>(null);

  // 编辑模态框状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingScript, setEditingScript] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    language: '',
    description: '',
    tags: [] as string[],
    version: '',
    content: '',
    parameters: [] as Array<{name: string; type: string; required: boolean; default: any; description: string}>
  });

  // 添加筛选状态管理
  const [filters, setFilters] = useState({
    category: '',
    language: '',
  });
  const [searchKeyword, setSearchKeyword] = useState('');

  // 运行脚本模态框状态
  const [runModalVisible, setRunModalVisible] = useState(false);
  const [currentScript, setCurrentScript] = useState<any>(null);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [filteredHosts, setFilteredHosts] = useState<Host[]>([]);
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [hostFilters, setHostFilters] = useState({
    type: '',
    environment: '',
    businessLine: '',
    keyword: '',
    searchField: 'all', // 搜索字段选择
    searchMode: 'fuzzy' as 'fuzzy' | 'exact' // 匹配模式
  });
  
  // 脚本执行相关状态
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<ScriptRunResponse | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  // 主机详情模态框状态
  const [hostDetailModalVisible, setHostDetailModalVisible] = useState(false);
  const [selectedHostForDetail, setSelectedHostForDetail] = useState<Host | null>(null);

  // 实现筛选逻辑
  const filteredScripts = scripts.filter(script => {
    // 根据分类筛选
    if (filters.category && script.category !== filters.category) {
      return false;
    }
    
    // 根据语言筛选
    if (filters.language && script.language !== filters.language) {
      return false;
    }
    
    // 根据关键词搜索
    if (searchKeyword && !script.name.toLowerCase().includes(searchKeyword.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // 从API获取脚本列表
  useEffect(() => {
    const fetchScripts = async () => {
      try {
        setLoading(true);
        const scriptList = await getScripts();
        setScripts(scriptList || []);
        setPagination({
          ...pagination,
          total: scriptList.length,
        });
      } catch (error) {
        message.error('获取脚本列表失败');
        console.error('Error fetching scripts:', error);
        setScripts([]);
        setPagination(prev => ({ ...prev, total: 0 }));
      } finally {
        setLoading(false);
      }
    };

    fetchScripts();
  }, []);

  // 分页变更处理
  const handlePageChange = (page: number) => {
    setPagination({
      ...pagination,
      current: page,
    });
    // 这里应该重新请求数据
  };

  // 查看脚本详情
  const handleViewDetail = (script: any) => {
    setSelectedScript({ ...script });
    setDetailModalVisible(true);
  };

  // 编辑脚本
  const handleEditScript = (script: any) => {
    setEditingScript(script);
    setFormData({
      name: script.name || '',
      category: script.category || '',
      language: script.language || '',
      description: script.description || '',
      tags: [...(script.tags || [])],
      version: script.version || '',
      content: script.content || '',
      parameters: script.parameters ? [...script.parameters] : []
    });
    setEditModalVisible(true);
  };

  // 添加新参数
  const addNewParameter = () => {
    setFormData(prev => ({
      ...prev,
      parameters: prev.parameters
        ? [...prev.parameters, { name: '', type: 'string', required: false, default: '', description: '' }]
        : [{ name: '', type: 'string', required: false, default: '', description: '' }]
    }));
  };

  // 更新参数
  const updateParameter = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const existingParameters = prev.parameters || [];
      if (index < 0 || index >= existingParameters.length) return prev;
      
      const newParameters = [...existingParameters];
      newParameters[index] = {
        ...newParameters[index],
        [field]: value
      };
      return {
        ...prev,
        parameters: newParameters
      };
    });
  };

  // 删除参数
  const removeParameter = (index: number) => {
    setFormData(prev => {
      const existingParameters = prev.parameters || [];
      if (index < 0 || index >= existingParameters.length) return prev;
      
      const newParameters = existingParameters.filter((_, i) => i !== index);
      return {
        ...prev,
        parameters: newParameters
      };
    });
  };

  // 处理表单输入变化
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 保存脚本编辑
  const handleSaveScript = async () => {
    // 表单验证
    if (!formData.name || !formData.content) {
      message.error('脚本名称和内容不能为空');
      return;
    }

    try {
      // 准备脚本数据
      const scriptData = {
        name: formData.name,
        category: formData.category,
        language: formData.language,
        version: formData.version,
        description: formData.description || '',
        parameters: formData.parameters || [],
        tags: formData.tags || [],
        content: formData.content,
        creator: currentUserName,
        status: '启用'
      };

      let savedScript: any;
      // 修复：将 ID 转换为字符串再检查，避免数字 ID 调用 startsWith 报错
      const scriptId = String(editingScript.id);
      if (scriptId.startsWith('new-')) {
        // 创建新脚本
        savedScript = await createScript(scriptData);
        // 添加到脚本列表
        setScripts(prevScripts => [...prevScripts, savedScript]);
      } else {
        // 更新现有脚本
        savedScript = await updateScript(scriptId, scriptData);
        // 更新脚本列表 - 包含 content 字段
        setScripts(prevScripts =>
          prevScripts.map(script =>
            String(script.id) === scriptId
              ? {
                  ...script,
                  name: savedScript.name,
                  category: savedScript.category,
                  language: savedScript.language,
                  version: savedScript.version,
                  description: savedScript.description || '',
                  parameters: savedScript.parameters || [],
                  tags: savedScript.tags || [],
                  content: savedScript.content || '',  // 关键修复：更新 content 字段
                }
              : script
          )
        );
      }
      
      message.success('脚本保存成功');
      setEditModalVisible(false);
    } catch (error) {
      console.error('保存脚本失败:', error);
      message.error('保存脚本失败');
    }
  };

  // 运行脚本
  const handleRunScript = async (script: any) => {
    // 打开运行脚本模态框前，加载CMDB主机数据
    await loadHostData();
    setCurrentScript(script);
    setRunModalVisible(true);
    setSelectedHost(null);
    // 重置筛选条件
    setHostFilters({
      type: '',
      environment: '',
      businessLine: '',
      keyword: '',
    });
  };

  // 加载CMDB主机数据
  const loadHostData = async () => {
    try {
      // 从CMDB API获取主机数据 - 支持所有CMDB类型
      const configItems = await getConfigItems({
        types: hostFilters.type ? [hostFilters.type as any] : undefined, // 不传types参数表示获取所有类型
        environment: (hostFilters.environment || undefined) as any,
        keyword: hostFilters.keyword || undefined,
        businessLine: hostFilters.businessLine || undefined,
      });
      
      // 转换为Host格式
      const hosts: Host[] = configItems.map(item => ({
        id: item.id,
        name: item.name,
        ip: item.ip || '',
        hostname: item.hostname || '',
        os: item.os || '',
        cpu: item.cpu || 0,
        memory: item.memory || 0,
        disk: item.disk || 0,
        status: item.status === 'active' ? '在线' : 
                item.status === 'maintenance' ? '维护中' : '离线',
        environment: item.environment,
        businessLine: item.businessLine,
        tags: item.tags || [],
        type: item.type // 添加类型字段
      }));
      
      setHosts(hosts);
      setFilteredHosts(hosts);
    } catch (error) {
      console.error('加载主机数据失败:', error);
      message.error('加载主机数据失败');
    }
  };

  // 获取搜索字段的显示标签
  const getSearchFieldLabel = (field: string): string => {
    const fieldLabels: Record<string, string> = {
      'all': '所有字段',
      'name': '名称',
      'ip': 'IP地址',
      'hostname': '主机名',
      'businessLine': '业务线',
      'owner': '负责人',
      'sshUsername': 'SSH用户名',
      'sshPort': 'SSH端口',
      'tags': '标签',
      'os': '操作系统',
      'deviceType': '设备类型',
      'location': '位置',
      'version': '版本'
    };
    return fieldLabels[field] || field;
  };

  // 获取类型的中文标签
  const getTypeLabel = (type?: string): string => {
    const typeLabels: Record<string, string> = {
      'host': '主机',
      'vm': '虚拟机',
      'physical': '物理机',
      'container': '容器',
      'cloud': '云主机',
      'virtualization': '虚拟化',
      'network': '网络设备',
      'application': '应用服务',
      'middleware': '中间件',
      'database': '数据库'
    };
    return typeLabels[type || ''] || type || '未知';
  };

  // 检查文本是否匹配搜索关键词
  const checkMatch = (text: string, keyword: string): boolean => {
    if (!text) return false;
    
    if (hostFilters.searchMode === 'exact') {
      // 精确匹配：完全相等（忽略大小写）
      return text.toLowerCase() === keyword.toLowerCase();
    } else {
      // 模糊匹配：包含关键词（默认）
      return text.toLowerCase().includes(keyword.toLowerCase());
    }
  };

  // 筛选主机 - 增强版：支持智能全文检索
  const filterHosts = () => {
    let filtered = [...hosts];
    
    // 按环境筛选
    if (hostFilters.environment) {
      filtered = filtered.filter(host => host.environment === hostFilters.environment);
    }
    
    // 按业务线筛选
    if (hostFilters.businessLine) {
      filtered = filtered.filter(host => host.businessLine === hostFilters.businessLine);
    }
    
    // 按关键词搜索 - 智能搜索
    if (hostFilters.keyword) {
      const keyword = hostFilters.keyword;
      
      filtered = filtered.filter(host => {
        switch (hostFilters.searchField) {
          case 'all':
            // 搜索所有文本字段
            return (
              checkMatch(host.name, keyword) ||
              checkMatch(host.businessLine || '', keyword) ||
              checkMatch(host.ip || '', keyword) ||
              checkMatch(host.hostname || '', keyword) ||
              checkMatch(host.os || '', keyword) ||
              (host.tags || []).some(tag => checkMatch(tag || '', keyword))
            );
            
          case 'name':
            return checkMatch(host.name, keyword);
            
          case 'ip':
            return checkMatch(host.ip || '', keyword);
            
          case 'hostname':
            return checkMatch(host.hostname || '', keyword);
            
          case 'businessLine':
            return checkMatch(host.businessLine || '', keyword);
            
          case 'tags':
            return (host.tags || []).some(tag => checkMatch(tag || '', keyword));
            
          default:
            return checkMatch(host.name, keyword) ||
                   checkMatch(host.businessLine || '', keyword) ||
                   (host.tags || []).some(tag => checkMatch(tag || '', keyword));
        }
      });
    }
    
    setFilteredHosts(filtered);
  };

  // 处理主机筛选条件变化
  const handleHostFilterChange = (field: string, value: string) => {
    setHostFilters(prev => ({
      ...prev,
      [field]: value
    }));
    // 自动应用筛选
    filterHosts();
  };

  // 应用主机筛选
  const applyHostFilters = () => {
    filterHosts();
  };

  // 重置主机筛选
  const resetHostFilters = () => {
    setHostFilters({
      type: '',
      environment: '',
      businessLine: '',
      keyword: '',
    });
    setFilteredHosts(hosts);
  };

  // 确认运行脚本
  const confirmRunScript = async () => {
    if (!selectedHost) {
      message.warning('请先选择一台主机');
      return;
    }
    
    let executionLogId: string | null = null;
    
    try {
      setIsRunning(true);
      setRunResult(null);
      
      // 创建执行日志记录
      const logData = {
        script_id: parseInt(currentScript.id),
        execution_type: 'script' as const,
        name: `${currentScript.name} - ${selectedHost.name}(${selectedHost.ip})`,
        status: 'running',
        creator: currentUserName
      };
      
      const executionLog = await createExecutionLog(logData);
      executionLogId = executionLog.id;
      
      // 准备运行请求
      const runRequest: ScriptRunRequest = {
        parameters: {},
        host: selectedHost.ip
      };
      
      // 调用API运行脚本
      const result = await runScript(currentScript.id, runRequest);
      
      setRunResult(result);
      setShowResult(true);
      
      // 更新执行日志状态
      if (executionLogId) {
        await completeExecutionLog(
          executionLogId,
          result.status === 'success' ? 'success' : 'failed',
          result.output,
          result.error
        );
      }
      
      message.success(`脚本在主机 ${selectedHost.name}(${selectedHost.ip}) 上运行完成`);
    } catch (error) {
      console.error('运行脚本失败:', error);
      message.error('运行脚本失败');
      
      // 设置错误结果
      const errorResult = {
        status: 'error',
        error: error instanceof Error ? error.message : '未知错误',
        output: undefined,
        executionTime: undefined
      };
      
      setRunResult(errorResult);
      setShowResult(true);
      
      // 更新执行日志状态为失败
      if (executionLogId) {
        try {
          await completeExecutionLog(
            executionLogId,
            'failed',
            undefined,
            error instanceof Error ? error.message : '未知错误'
          );
        } catch (logError) {
          console.error('更新执行日志失败:', logError);
        }
      }
    } finally {
      setIsRunning(false);
    }
  };
  
  // 查看主机详情
  const handleViewHostDetail = (host: Host) => {
    setSelectedHostForDetail(host);
    setHostDetailModalVisible(true);
  };

  // 渲染运行脚本模态框
  const renderRunModal = () => {
    if (!currentScript) return null;
    
    return (
      <Modal
        title={`运行脚本: ${currentScript.name}`}
        visible={runModalVisible}
        onCancel={() => setRunModalVisible(false)}
        footer={null}
        width={800}
      >
        <div className="space-y-4">
          {/* 脚本信息卡片 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">脚本信息</h3>
            <div className="grid grid-cols-2 gap-2">
              <div><strong>名称:</strong> {currentScript.name}</div>
              <div><strong>语言:</strong> {currentScript.language}</div>
              <div><strong>分类:</strong> {currentScript.category}</div>
              <div><strong>版本:</strong> {currentScript.version}</div>
            </div>
          </div>
          
          {/* 主机筛选条件 - 智能搜索框 */}
          <div>
            <h3 className="text-lg font-medium mb-2">筛选主机</h3>
            <div className="flex gap-2 mb-4">
              {/* 智能搜索框 */}
              <div className="flex items-center bg-white border border-gray-300 rounded text-sm w-full">
                {/* 搜索输入框 */}
                <div className="flex-1 flex items-center">
                  <input
                    type="text"
                    placeholder={hostFilters.searchField === 'all' ? "搜索所有字段..." : `搜索${getSearchFieldLabel(hostFilters.searchField)}...`}
                    className="flex-1 px-2 py-1 border-0 focus:outline-none focus:ring-0"
                    value={hostFilters.keyword}
                    onChange={e => handleHostFilterChange('keyword', e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') applyHostFilters(); }}
                  />
                  {/* 清除按钮 */}
                  {hostFilters.keyword && (
                    <button
                      className="px-2 text-gray-400 hover:text-gray-600"
                      onClick={() => handleHostFilterChange('keyword', '')}
                      title="清除搜索"
                    >
                      <i className="fa fa-times text-xs"></i>
                    </button>
                  )}
                </div>
                
                {/* 匹配模式切换按钮 */}
                <button
                  className={`px-2 py-1 border-l border-gray-200 text-xs ${hostFilters.searchMode === 'exact' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => handleHostFilterChange('searchMode', hostFilters.searchMode === 'exact' ? 'fuzzy' : 'exact')}
                  title={hostFilters.searchMode === 'exact' ? '精确匹配模式' : '模糊匹配模式'}
                >
                  {hostFilters.searchMode === 'exact' ? '精确' : '模糊'}
                </button>
                
                {/* 字段选择器 */}
                <div className="relative">
                  <select
                    className="appearance-none bg-transparent border-0 pl-1 pr-6 py-1 text-xs text-gray-600 focus:outline-none focus:ring-0 cursor-pointer"
                    value={hostFilters.searchField}
                    onChange={(e) => handleHostFilterChange('searchField', e.target.value)}
                  >
                    <option value="all">🔍 所有</option>
                    <option value="name">📝 名称</option>
                    <option value="ip">🌐 IP地址</option>
                    <option value="hostname">🖥️ 主机名</option>
                    <option value="businessLine">🏢 业务线</option>
                    <option value="tags">🏷️ 标签</option>
                  </select>
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                    <i className="fa fa-chevron-down text-xs"></i>
                  </div>
                </div>
                {/* 搜索按钮 */}
                <button className="px-3 py-1 bg-blue-500 text-white rounded-r text-sm hover:bg-blue-600 border-l border-blue-400"
                  onClick={applyHostFilters}>搜索</button>
              </div>
            </div>
          </div>
          
          {/* 主机表格 - 修改为表格形式 */}
          <div>
            <h3 className="text-lg font-medium mb-2">选择主机 ({filteredHosts.length}台)</h3>
            <div className="max-h-80 overflow-y-auto border rounded-lg">
              {/* 表格化主机列表 - 类似Excel表格 */}
              <div className="border rounded max-h-64 overflow-y-auto">
                {/* 表格标题行 */}
                <div className="grid grid-cols-12 bg-gray-50 border-b text-xs font-medium text-gray-600 sticky top-0 z-10">
                  <div className="col-span-1 px-3 py-2 text-center">选择</div>
                  <div className="col-span-2 px-3 py-2 border-l">IP地址</div>
                  <div className="col-span-2 px-3 py-2 border-l">名称</div>
                  <div className="col-span-1 px-3 py-2 border-l">类型</div>
                  <div className="col-span-1 px-3 py-2 border-l">状态</div>
                  <div className="col-span-2 px-3 py-2 border-l">环境</div>
                  <div className="col-span-3 px-3 py-2 border-l">业务线</div>
                </div>
                
                {/* 表格数据行 */}
                {filteredHosts.map(host => (
                  <div 
                    key={host.id}
                    className={`grid grid-cols-12 border-b hover:bg-gray-50 cursor-pointer ${selectedHost?.id === host.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedHost(host)}
                  >
                    {/* 选择列 */}
                    <div className="col-span-1 px-3 py-2 flex items-center justify-center">
                      <div className={`w-4 h-4 rounded-full border ${selectedHost?.id === host.id ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}></div>
                    </div>
                    
                    {/* IP地址列 */}
                    <div className="col-span-2 px-3 py-2 border-l">
                      <div className="font-medium truncate" title={host.ip || '无IP地址'}>
                        {host.ip || '无IP地址'}
                      </div>
                      <div className="text-xs text-gray-500 truncate" title={host.hostname || '无主机名'}>
                        {host.hostname || '无主机名'}
                      </div>
                    </div>
                    
                    {/* 名称列 */}
                    <div className="col-span-2 px-3 py-2 border-l">
                      <div className="font-medium truncate" title={host.name}>
                        {host.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate" title={host.os || '未知系统'}>
                        {host.os || '未知系统'}
                      </div>
                    </div>
                    
                    {/* 类型列 */}
                    <div className="col-span-1 px-3 py-2 border-l">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded truncate block" title={getTypeLabel(host.type)}>
                        {getTypeLabel(host.type)}
                      </span>
                    </div>
                    
                    {/* 状态列 */}
                    <div className="col-span-1 px-3 py-2 border-l">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${host.status === '在线' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {host.status}
                      </span>
                    </div>
                    
                    {/* 环境列 */}
                    <div className="col-span-2 px-3 py-2 border-l">
                      <span className={`text-xs px-2 py-1 rounded truncate block ${
                        host.environment === 'prod' ? 'bg-red-100 text-red-800' :
                        host.environment === 'test' ? 'bg-blue-100 text-blue-800' :
                        host.environment === 'dev' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`} title={host.environment}>
                        {host.environment === 'prod' ? '生产' :
                         host.environment === 'test' ? '测试' :
                         host.environment === 'dev' ? '开发' :
                         host.environment === 'staging' ? '预发布' : host.environment}
                      </span>
                    </div>
                    
                    {/* 业务线列 */}
                    <div className="col-span-3 px-3 py-2 border-l">
                      <div className="font-medium truncate" title={host.businessLine || '未分配'}>
                        {host.businessLine || '未分配'}
                      </div>
                      <div className="text-xs text-gray-500 truncate" title={host.tags?.join(', ') || '无标签'}>
                        {host.tags?.slice(0, 2).join(', ') || '无标签'}
                        {host.tags && host.tags.length > 2 && '...'}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredHosts.length === 0 && (
                  <div className="p-4 text-center text-gray-500">暂无匹配的主机</div>
                )}
              </div>
            </div>
          </div>
          
          {/* 选中的主机信息 */}
          {selectedHost && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">选中主机信息</h3>
              <div className="grid grid-cols-2 gap-2">
                <div><strong>名称:</strong> {selectedHost.name}</div>
                <div><strong>IP地址:</strong> {selectedHost.ip}</div>
                <div><strong>主机名:</strong> {selectedHost.hostname}</div>
                <div><strong>操作系统:</strong> {selectedHost.os}</div>
                <div><strong>CPU:</strong> {selectedHost.cpu}核</div>
                <div><strong>内存:</strong> {selectedHost.memory}GB</div>
                <div><strong>磁盘:</strong> {selectedHost.disk}GB</div>
                <div><strong>状态:</strong> {selectedHost.status}</div>
              </div>
            </div>
          )}
          
          {/* 操作按钮 */}
          <div className="flex justify-end space-x-2 mt-4">
            <button
              className="border px-4 py-2 rounded-md hover:bg-gray-100"
              onClick={() => setRunModalVisible(false)}
            >
              取消
            </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              onClick={confirmRunScript}
            >
              确认运行
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  // 删除脚本
  const handleDeleteScript = async (script: any) => {
    // 删除脚本逻辑
    if (window.confirm(`确定要删除脚本"${script.name}"吗？`)) {
      try {
        await deleteScript(script.id);
        // 从脚本列表中移除
        setScripts(prevScripts => prevScripts.filter(s => s.id !== script.id));
        message.success('脚本删除成功');
      } catch (error) {
        console.error('删除脚本失败:', error);
        message.error('删除脚本失败');
      }
    }
  };
  
  // 渲染主机详情模态框
  const renderHostDetailModal = () => {
    if (!selectedHostForDetail) return null;
    
    return (
      <Modal
        title="主机详情"
        visible={hostDetailModalVisible}
        onCancel={() => setHostDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        <div className="space-y-6 p-2 max-h-[60vh] overflow-y-auto">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">主机名称：</span>
                <span className="font-medium text-gray-900">{selectedHostForDetail.name}</span>
              </div>
              <div>
                <span className="text-gray-500">IP地址：</span>
                <span className="font-mono font-medium text-gray-900">{selectedHostForDetail.ip}</span>
              </div>
              <div>
                <span className="text-gray-500">主机名：</span>
                <span className="font-medium text-gray-900">{selectedHostForDetail.hostname}</span>
              </div>
              <div>
                <span className="text-gray-500">操作系统：</span>
                <span className="font-medium text-gray-900">{selectedHostForDetail.os}</span>
              </div>
              <div>
                <span className="text-gray-500">环境：</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedHostForDetail.environment === 'prod' ? 'bg-red-100 text-red-800' : selectedHostForDetail.environment === 'staging' ? 'bg-orange-100 text-orange-800' : selectedHostForDetail.environment === 'test' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                  {selectedHostForDetail.environment.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">业务线：</span>
                <span className="font-medium text-gray-900">{selectedHostForDetail.businessLine}</span>
              </div>
              <div>
                <span className="text-gray-500">状态：</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedHostForDetail.status === '在线' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {selectedHostForDetail.status}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">硬件信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-500 mb-1">CPU</div>
                <div className="text-xl font-medium text-gray-900">{selectedHostForDetail.cpu}核</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-500 mb-1">内存</div>
                <div className="text-xl font-medium text-gray-900">{selectedHostForDetail.memory}GB</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-500 mb-1">磁盘</div>
                <div className="text-xl font-medium text-gray-900">{selectedHostForDetail.disk}GB</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3">标签信息</h3>
            <div className="flex flex-wrap gap-2">
              {selectedHostForDetail.tags.filter((tag: string) => tag).map((tag: string, index: number) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {tag}
                </span>
              ))}
              {selectedHostForDetail.tags.filter((tag: string) => tag).length === 0 && (
                <span className="text-gray-500 text-sm">暂无标签</span>
              )}
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex justify-end space-x-2 mt-6">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              onClick={() => setHostDetailModalVisible(false)}
            >
              关闭
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  // 渲染脚本执行结果模态框
  const renderResultModal = () => {
    if (!showResult || !runResult) return null;
    
    const isSuccess = runResult.status === 'success';
    
    return (
      <Modal
        title={isSuccess ? '脚本执行成功' : '脚本执行失败'}
        visible={showResult}
        onCancel={() => setShowResult(false)}
        footer={( 
          <div className="flex justify-end p-4 space-x-2">
            <button
              className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setShowResult(false)}
            >
              关闭
            </button>
          </div>
        )}
        width={900}
      >
        <div className="space-y-4">
          {/* 执行状态 */}
          <div className={`p-4 rounded-lg ${isSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              <i className={`fa ${isSuccess ? 'fa-check-circle text-green-600' : 'fa-times-circle text-red-600'}`}></i>
              <span className={`font-medium ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
                {isSuccess ? '执行成功' : '执行失败'}
              </span>
            </div>
            {runResult.executionTime && (
              <div className="text-sm text-gray-600 mt-2">
                执行时间: {runResult.executionTime.toFixed(2)}秒
              </div>
            )}
          </div>
          
          {/* 错误信息 */}
          {runResult.error && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">错误信息</h3>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-800 font-mono text-sm">
                <pre className="whitespace-pre-wrap">{runResult.error}</pre>
              </div>
            </div>
          )}
          
          {/* 输出结果 */}
          {runResult.output && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">输出结果</h3>
              <div className="bg-gray-800 text-gray-200 p-4 rounded-lg font-mono text-sm max-h-[400px] overflow-y-auto">
                <pre className="whitespace-pre-wrap">{runResult.output}</pre>
              </div>
            </div>
          )}
        </div>
      </Modal>
    );
  };

  // 新建脚本
  const handleCreateScript = () => {
    // 初始化新建脚本的数据
    const newScript = {
      id: `new-${Date.now()}`,
      name: '',
      category: '操作系统',
      language: 'Shell',
      description: '',
      tags: [],
      version: '1.0.0',
      content: '',
      parameters: [],
      creator: currentUserName,
      createTime: new Date().toLocaleString('zh-CN'),
      lastUsed: '-',
      status: '启用'
    };
    
    setEditingScript(newScript);
    setFormData({
      name: '',
      category: '操作系统',
      language: 'Shell',
      description: '',
      tags: [],
      version: '1.0.0',
      content: '',
      parameters: []
    });
    setEditModalVisible(true);
  };

  // 导入脚本
  const handleImportScript = () => {
    // 导入脚本逻辑
    console.log('导入脚本');
  };

  // 导出脚本
  const handleExportScript = () => {
    if (selectedRowKeys.size === 0) {
      message.warning('请先选择要导出的脚本');
      return;
    }

    // 获取选中的脚本
    const selectedScripts = scripts.filter(script => selectedRowKeys.has(script.id));
    
    // 无论选择单个还是多个脚本，都导出为CSV格式
    exportScriptsAsCSV(selectedScripts);
  };

  // CSV格式导出函数
  const exportScriptsAsCSV = (selectedScripts: any[]) => {
    // 准备CSV表头（使用表格列的标题）
    const headers = ['脚本名称', '分类', '语言', '创建人', '创建时间', '最近使用', '版本', '状态'];
    
    // 准备CSV数据行
    const csvContent = [
      // 表头行
      headers.map(header => escapeCSV(header)).join(','),
      // 数据行
      ...selectedScripts.map(script => [
        script.name || '',
        script.category || '',
        script.language || '',
        script.creator || '',
        script.createTime || '',
        script.lastUsed || '',
        script.version || '',
        script.status || ''
      ].map(value => escapeCSV(value)).join(','))
    ].join('\n');
    
    // 下载CSV文件
    downloadFile('脚本列表导出.csv', csvContent, 'text/csv;charset=utf-8;');
    message.success(`成功导出 ${selectedScripts.length} 个脚本数据到CSV文件`);
  };

  // CSV转义辅助函数
  const escapeCSV = (value: string): string => {
    // 如果值包含逗号、引号或换行符，需要用引号包裹并转义内部引号
    if (typeof value !== 'string') {
      value = String(value);
    }
    
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      // 转义双引号为两个双引号，并用双引号包裹整个值
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  // 增强文件下载辅助函数，支持自定义MIME类型
  const downloadFile = (filename: string, content: string, mimeType: string = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 处理行选择
  const handleRowSelect = (id: string) => {
    const newSelectedRowKeys = new Set(selectedRowKeys);
    if (newSelectedRowKeys.has(id)) {
      newSelectedRowKeys.delete(id);
    } else {
      newSelectedRowKeys.add(id);
    }
    setSelectedRowKeys(newSelectedRowKeys);
  };

  // 处理全选
  const handleSelectAll = () => {
    if (selectedRowKeys.size === filteredScripts.length) {
      setSelectedRowKeys(new Set());
    } else {
      setSelectedRowKeys(new Set(filteredScripts.map(script => script.id)));
    }
  };

  // 刷新脚本列表
  const handleRefreshScripts = () => {
    // 刷新脚本列表逻辑
    console.log('刷新脚本列表');
    setLoading(true);
    // 模拟刷新操作
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  // 切换脚本状态（启用/禁用）
  const handleToggleStatus = async (record: any, newStatus: string) => {
    try {
      // 模拟API调用更新脚本状态
      await new Promise(resolve => setTimeout(resolve, 300));
      // 更新本地状态
      setScripts(prevScripts =>
        prevScripts.map(script =>
          script.id === record.id
            ? { ...script, status: newStatus }
            : script
        )
      );
      // 显示成功消息
      message.success(`脚本已${newStatus}成功`);
    } catch (error) {
      console.error('切换脚本状态失败:', error);
      message.error(`切换脚本状态失败: ${String(error)}`);
    }
  };

  // 脚本列表的表格列配置 - 移到filteredScripts定义之后
  const scriptColumns = [
    {
      title: (
        <div className="flex items-center cursor-pointer" onClick={handleSelectAll}>
          <input
            type="checkbox"
            checked={selectedRowKeys.size > 0 && selectedRowKeys.size === filteredScripts.length}
            onChange={(e) => e.stopPropagation()}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-1 text-sm">全选</span>
        </div>
      ),
      width: '60',
      dataIndex: 'id' as const,
      render: (_: string, record: any) => (
        <input
          type="checkbox"
          checked={selectedRowKeys.has(record.id)}
          onChange={(e) => {
            e.stopPropagation();
            handleRowSelect(record.id);
          }}
          className="rounded text-blue-600 focus:ring-blue-500"
        />
      ),
    },
    {
      title: '脚本名称',
      dataIndex: 'name' as const,
      width: '200',
    },
    {
      title: '分类',
      dataIndex: 'category' as const,
      width: '100',
    },
    {
      title: '语言',
      dataIndex: 'language' as const,
      width: '100',
    },
    {
      title: '标签',
      dataIndex: 'tags' as const,
      width: '150',
      render: (tags: string[] | undefined) => {
        if (!tags || tags.length === 0) {
          return <span className="text-gray-400">无</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      title: '创建人',
      dataIndex: 'creator' as const,
      width: '100',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime' as const,
      width: '150',
    },
    {
      title: '最近使用',
      dataIndex: 'lastUsed' as const,
      width: '150',
    },
    {
      title: '版本',
      dataIndex: 'version' as const,
      width: '100',
    },
    {
      title: '状态',
      dataIndex: 'status' as const,
      width: '100',
      render: (text: string) => {
        const statusClass = text === '启用' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-800';
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
            {text}
          </span>
        );
      },
    },
    {
      title: '操作',
      dataIndex: 'id' as const,
      width: '180',
      render: (_: string, record: any) => (
        <div className="flex space-x-1 flex-wrap">
          <button 
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs"
            onClick={() => handleViewDetail(record)}
          >
            查看
          </button>
          {record.status === '启用' && (
            <button
              className="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded text-xs"
              onClick={() => handleRunScript(record)}
            >
              执行
            </button>
          )}
          <button 
            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1 rounded text-xs"
            onClick={() => handleEditScript(record)}
          >
            编辑
          </button>
          <button 
            className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-xs"
            onClick={() => handleDeleteScript(record)}
          >
            删除
          </button>
          {record.status === '启用' ? (
            <button
              className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded text-xs"
              onClick={() => handleToggleStatus(record, '禁用')}
            >
              禁用
            </button>
          ) : (
            <button
              className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded text-xs"
              onClick={() => handleToggleStatus(record, '启用')}
            >
              启用
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">脚本管理</h1>
        <p className="mt-1 text-sm text-gray-500">管理和使用系统中的脚本资源</p>
      </div>

      {/* 操作栏 */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex space-x-2">
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
              onClick={handleCreateScript}
            >
              <i className="fa fa-plus mr-2"></i>
              新建脚本
            </button>
            <button 
              className="px-4 py-2 border rounded-md hover:bg-gray-100 flex items-center"
              onClick={handleImportScript}
            >
              <i className="fa fa-upload mr-2"></i>
              导入
            </button>
            <button 
              className="px-4 py-2 border rounded-md hover:bg-gray-100 flex items-center"
              onClick={handleExportScript}
            >
              <i className="fa fa-download mr-2"></i>
              导出
            </button>
            <button 
              className="px-4 py-2 border rounded-md hover:bg-gray-100 flex items-center"
              onClick={handleRefreshScripts}
            >
              <i className="fa fa-refresh mr-2"></i>
              刷新
            </button>
          </div>
          <div className="flex space-x-2 items-center">
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
            >
              <option value="">全部分类</option>
              <option value="操作系统">操作系统</option>
              <option value="数据库">数据库</option>
              <option value="中间件">中间件</option>
              <option value="其他">其他</option>
            </select>
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.language}
              onChange={(e) => setFilters({...filters, language: e.target.value})}
            >
              <option value="">全部语言</option>
              <option value="Shell">Shell</option>
              <option value="Python">Python</option>
              <option value="JavaScript">JavaScript</option>
              <option value="Java">Java</option>
            </select>
            <div className="relative">
              <input
                type="text"
                placeholder="搜索脚本名称..."
                className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <i className="fa fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>
          </div>
        </div>
      </div>

      {/* 脚本列表 */}
      <div className="bg-white rounded-lg shadow-sm">
        <DataTable
          columns={scriptColumns}
          dataSource={filteredScripts}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: filteredScripts.length,
            onChange: handlePageChange,
          }}
        />
      </div>

      {/* 脚本详情模态框 */}
      <Modal
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        title="脚本详情"
        width={800}
        footer={( 
          <div className="flex justify-end p-4 space-x-2">
            <button
              className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setDetailModalVisible(false)}
            >
              关闭
            </button>
          </div>
        )}
      >
        {selectedScript && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">{selectedScript.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{selectedScript.description}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedScript.tags.map((tag: string, index: number) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">创建人：</span>
                <span className="font-medium text-gray-900">{selectedScript.creator}</span>
              </div>
              <div>
                <span className="text-gray-500">创建时间：</span>
                <span className="font-medium text-gray-900">{selectedScript.createTime}</span>
              </div>
              <div>
                <span className="text-gray-500">分类：</span>
                <span className="font-medium text-gray-900">{selectedScript.category}</span>
              </div>
              <div>
                <span className="text-gray-500">语言：</span>
                <span className="font-medium text-gray-900">{selectedScript.language}</span>
              </div>
              <div>
                <span className="text-gray-500">版本：</span>
                <span className="font-medium text-gray-900">{selectedScript.version}</span>
              </div>
              <div>
                <span className="text-gray-500">最近使用：</span>
                <span className="font-medium text-gray-900">{selectedScript.lastUsed}</span>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">参数说明</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">参数名</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">必填</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">默认值</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(selectedScript.parameters || []).map((param: any, index: number) => (
                      <tr key={index}>
                        <td className="px-3 py-2 font-medium">{param.name}</td>
                        <td className="px-3 py-2">{param.type}</td>
                        <td className="px-3 py-2">{param.required ? '是' : '否'}</td>
                        <td className="px-3 py-2 font-mono">{param.default !== undefined ? param.default : '-'}</td>
                        <td className="px-3 py-2">{param.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">脚本内容</h4>
              <div className="bg-gray-800 text-gray-200 p-4 rounded-md overflow-x-auto text-sm font-mono max-h-[300px] overflow-y-auto">
                <pre>{selectedScript.content}</pre>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 脚本编辑模态框 */}
      <Modal
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        title="编辑脚本"
        width={800}
        className="shadow-xl"
        footer={( 
          <div className="flex justify-end p-4 space-x-2">
            <button
              className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setEditModalVisible(false)}
            >
              取消
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              onClick={handleSaveScript}
            >
              保存
            </button>
          </div>
        )}
      >
        {editingScript && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto p-4">
            {/* 基本信息卡片 */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-3">基本信息</h3>
              <div className="space-y-3">
                {/* 脚本名称区域 */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">
                    <span className="text-red-500">*</span>脚本名称
                  </label>
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                  />
                </div>
                
                {/* 分类、语言、版本 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">分类</label>
                    <select
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.category}
                      onChange={(e) => handleFormChange('category', e.target.value)}
                    >
                      <option value="操作系统">操作系统</option>
                      <option value="数据库">数据库</option>
                      <option value="中间件">中间件</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">语言</label>
                    <select
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.language}
                      onChange={(e) => handleFormChange('language', e.target.value)}
                    >
                      <option value="Shell">Shell</option>
                      <option value="Python">Python</option>
                      <option value="JavaScript">JavaScript</option>
                      <option value="Java">Java</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">版本</label>
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.version}
                      onChange={(e) => handleFormChange('version', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">描述</label>
                  <textarea
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                  />
                </div>
                
                {/* 标签区域，移到描述框后面 */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">标签</label>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {tag}
                          <button
                            type="button"
                            className="ml-1.5 h-3 w-3 rounded-full bg-blue-200 hover:bg-blue-300 flex items-center justify-center"
                            onClick={() => {
                              const newTags = [...formData.tags];
                              newTags.splice(index, 1);
                              handleFormChange('tags', newTags);
                            }}
                          >
                            <span className="text-blue-700 text-xs">×</span>
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="输入标签，用逗号分隔"
                      onKeyPress={(e) => {
                        if (e.key === ',' && e.currentTarget.value.trim()) {
                          const value = e.currentTarget.value.trim();
                          const newTags = [...formData.tags, value];
                          handleFormChange('tags', newTags);
                          e.currentTarget.value = '';
                          e.preventDefault();
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">输入标签后按逗号添加，点击标签上的×删除</p>
                  </div>
                </div>
                
                {/* 只读信息 */}
                <div className="bg-gray-50 p-4 rounded-md mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">创建人：</span>
                      <span className="font-medium text-gray-900">{editingScript.creator}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">创建时间：</span>
                      <span className="font-medium text-gray-900">{editingScript.createTime}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">最近使用：</span>
                      <span className="font-medium text-gray-900">{editingScript.lastUsed}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">状态：</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${editingScript.status === '启用' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {editingScript.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 参数说明卡片 */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">参数说明</h3>
                <button 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
                  onClick={() => addNewParameter()}
                >
                  添加参数
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">参数名</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">必填</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">默认值</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(formData.parameters || []).map((param: any, index: number) => (
                      <tr key={index}>
                        <td className="px-3 py-2">
                          <input 
                            type="text" 
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            value={param.name || ''}
                            onChange={(e) => updateParameter(index, 'name', e.target.value)}
                            placeholder="参数名"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select 
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            value={param.type || ''}
                            onChange={(e) => updateParameter(index, 'type', e.target.value)}
                          >
                            <option value="">选择类型</option>
                            <option value="string">string</option>
                            <option value="number">number</option>
                            <option value="boolean">boolean</option>
                            <option value="array">array</option>
                            <option value="object">object</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input 
                            type="checkbox" 
                            checked={param.required || false}
                            onChange={(e) => updateParameter(index, 'required', e.target.checked)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input 
                            type="text" 
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                            value={param.default !== undefined ? param.default : ''}
                            onChange={(e) => updateParameter(index, 'default', e.target.value)}
                            placeholder="默认值"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input 
                            type="text" 
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            value={param.description || ''}
                            onChange={(e) => updateParameter(index, 'description', e.target.value)}
                            placeholder="描述"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => removeParameter(index)}
                            disabled={(formData.parameters || []).length <= 1}
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                          暂无参数说明，点击"添加参数"按钮开始添加
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* 脚本内容卡片 */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mt-4">
              <h3 className="text-lg font-semibold mb-3">脚本内容</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500">*</span>脚本内容
                  </label>
                  <div className="bg-gray-800 text-gray-200 p-4 rounded-md overflow-x-auto max-h-[300px] overflow-y-auto">
                    <textarea
                      className="w-full min-h-[300px] bg-transparent border-none focus:outline-none text-sm font-mono resize-none"
                      value={formData.content}
                      onChange={(e) => handleFormChange('content', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* 原只读信息区域已移除 */}
          </div>
        )}
      </Modal>

      {/* 运行脚本模态框 */}
        {renderRunModal()}
        
        {/* 主机详情模态框 */}
        {renderHostDetailModal()}
        
        {/* 脚本执行结果模态框 */}
        {renderResultModal()}
      </div>
    );
  };

export default ScriptLibrary;
