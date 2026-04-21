import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Tag, Select, Input, Form } from 'antd';
import DataTable from '@/components/common/DataTable';
import Modal from '@/components/common/Modal';
import {
  getTaskSchedules, createTaskSchedule, updateTaskSchedule, deleteTaskSchedule,
  executeTaskSchedule, addScheduleItem, removeScheduleItem,
  TaskSchedule, TaskScheduleCreate, ScheduleItem
} from '@/api/automation';
import { getJobTemplates, JobTemplate } from '@/api/automation';
import { getConfigItems, ConfigurationItem } from '@/api/cmdb';

const { Option } = Select;

// TaskID 格式化
const formatTaskId = (prefix: string, id: number | string): string => {
  const num = String(id).padStart(10, '0');
  return `${prefix}-${num}`;
};

const TaskSchedules: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<TaskSchedule[]>([]);
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchKeyword, setSearchKeyword] = useState('');

  // Modal states
  const [detailVisible, setDetailVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [executeVisible, setExecuteVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<TaskSchedule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [hosts, setHosts] = useState<ConfigurationItem[]>([]);
  const [selectedHostId, setSelectedHostId] = useState<string>('');
  const [hostSearch, setHostSearch] = useState('');
  // 主机过滤器 - 增强版：支持智能全文检索
  const [hostFilter, setHostFilter] = useState({ 
    type: '', 
    environment: '', 
    businessLine: '', 
    keyword: '',
    searchField: 'all', // 搜索字段选择
    searchMode: 'fuzzy' as 'fuzzy' | 'exact' // 匹配模式
  });
  const [form] = Form.useForm();

  // 新建/编辑时的模板列表（可重复添加）
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<number[]>([]);
  const [addTemplateId, setAddTemplateId] = useState<number | undefined>(undefined);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [schedulesData, templatesData] = await Promise.all([
        getTaskSchedules(), getJobTemplates()
      ]);
      setSchedules(schedulesData || []);
      setTemplates(templatesData || []);
      await loadHosts();
      setPagination(prev => ({ ...prev, total: (schedulesData || []).length }));
    } catch { message.error('加载数据失败'); }
    finally { setLoading(false); }
  };

  const loadHosts = async () => {
    // 首先获取所有符合类型、环境、业务线过滤条件的主机
    // 支持所有CMDB类型：host, network, application, middleware, database, cloud, cabinet, physical, virtualization, vm, container
    const allItems = await getConfigItems({
      types: hostFilter.type ? [hostFilter.type as any] : undefined, // 不传types参数表示获取所有类型
      environment: (hostFilter.environment || undefined) as any,
      businessLine: hostFilter.businessLine || undefined,
    });
    
    // 如果有关键词，在前端进行智能过滤
    let filteredItems = allItems;
    if (hostFilter.keyword) {
      filteredItems = allItems.filter(item => {
        const keyword = hostFilter.keyword;
        
        switch (hostFilter.searchField) {
          case 'all':
            // 搜索所有文本字段
            return (
              checkMatch(item.name, keyword) ||
              checkMatch(item.businessLine || '', keyword) ||
              checkMatch(item.owner || '', keyword) ||
              checkMatch(item.ip || '', keyword) ||
              checkMatch(item.hostname || '', keyword) ||
              checkMatch(item.sshUsername || '', keyword) ||
              checkMatch(item.sshPort?.toString() || '', keyword) ||
              checkMatch(item.os || '', keyword) ||
              checkMatch(item.deviceType || '', keyword) ||
              checkMatch(item.location || '', keyword) ||
              checkMatch(item.version || '', keyword) ||
              (item.tags || []).some(tag => checkMatch(tag || '', keyword))
            );
            
          case 'name':
            return checkMatch(item.name, keyword);
            
          case 'ip':
            return checkMatch(item.ip || '', keyword);
            
          case 'hostname':
            return checkMatch(item.hostname || '', keyword);
            
          case 'businessLine':
            return checkMatch(item.businessLine || '', keyword);
            
          case 'owner':
            return checkMatch(item.owner || '', keyword);
            
          case 'sshUsername':
            return checkMatch(item.sshUsername || '', keyword);
            
          case 'sshPort':
            return checkMatch(item.sshPort?.toString() || '', keyword);
            
          case 'tags':
            return (item.tags || []).some(tag => checkMatch(tag || '', keyword));
            
          default:
            return checkMatch(item.name, keyword) ||
                   checkMatch(item.businessLine || '', keyword) ||
                   checkMatch(item.owner || '', keyword) ||
                   (item.tags || []).some(tag => checkMatch(tag || '', keyword));
        }
      });
    }
    
    setHosts(filteredItems);
  };

  const getTemplateName = (id?: number) => {
    if (!id) return '-';
    const t = templates.find(x => Number(x.id) === id);
    return t?.name || `模板${id}`;
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
    
    if (hostFilter.searchMode === 'exact') {
      // 精确匹配：完全相等（忽略大小写）
      return text.toLowerCase() === keyword.toLowerCase();
    } else {
      // 模糊匹配：包含关键词（默认）
      return text.toLowerCase().includes(keyword.toLowerCase());
    }
  };

  const statusMap: Record<string, { text: string; color: string }> = {
    active: { text: '启用', color: 'success' },
    inactive: { text: '停用', color: 'default' },
  };

  const filteredSchedules = schedules.filter(s => {
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      return s.name.toLowerCase().includes(kw) ||
        s.description?.toLowerCase().includes(kw);
    }
    return true;
  });

  const handleDelete = async (id: number) => {
    if (!window.confirm('确认删除该任务编排？')) return;
    try {
      await deleteTaskSchedule(id);
      message.success('删除成功');
      loadData();
    } catch { message.error('删除失败'); }
  };

  const handleAddTemplate = () => {
    if (addTemplateId && !selectedTemplateIds.includes(addTemplateId) || addTemplateId) {
      // 允许重复添加同一模板
      setSelectedTemplateIds([...selectedTemplateIds, addTemplateId]);
      setAddTemplateId(undefined);
    }
  };

  const handleRemoveTemplate = (index: number) => {
    setSelectedTemplateIds(selectedTemplateIds.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newIds = [...selectedTemplateIds];
      [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
      setSelectedTemplateIds(newIds);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < selectedTemplateIds.length - 1) {
      const newIds = [...selectedTemplateIds];
      [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
      setSelectedTemplateIds(newIds);
    }
  };

  const handleSave = async (values: any) => {
    try {
      const data: TaskScheduleCreate = {
        name: values.name,
        description: values.description,
        schedule_type: values.schedule_type || 'immediate',
        cron_expression: values.cron_expression,
        items: selectedTemplateIds.map(tid => ({ template_id: tid })),
      };
      if (isEditing && selectedSchedule) {
        await updateTaskSchedule(selectedSchedule.id, data);
        message.success('更新成功');
      } else {
        await createTaskSchedule(data);
        message.success('创建成功');
      }
      setEditVisible(false);
      loadData();
    } catch { message.error('保存失败'); }
  };

  const handleExecute = async () => {
    if (!selectedSchedule) return;
    setExecuting(true);
    try {
      const host = hosts.find(h => h.id === selectedHostId);
      const targetIp = host?.ip || undefined;
      const result = await executeTaskSchedule(selectedSchedule.id, targetIp);
      
      // 显示成功消息并自动跳转到执行日志
      message.success({
        content: (
          <div>
            <p>{result.message || `任务已开始执行，TaskID: Task-${String(result.task_id).padStart(10, '0')}`}</p>
            <p>
              <a 
                href="/execution-logs" 
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/execution-logs');
                }}
              >
                点击这里查看执行日志
              </a>
            </p>
          </div>
        ),
        duration: 5,
      });
      
      // 自动跳转到执行日志页面
      setTimeout(() => {
        navigate('/execution-logs');
      }, 2000);
      
      setExecuteVisible(false);
      setSelectedHostId('');
      loadData();
    } catch (e: any) {
      message.error(`执行失败：${e.message || '未知错误'}`);
      setExecuteVisible(false);
    } finally { setExecuting(false); }
  };

  const columns = [
    {
      title: '编排ID', dataIndex: 'id', key: 'task_id', width: 180,
      render: (v: number) => (
        <span className="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
          {formatTaskId('Sched', v)}
        </span>
      )
    },
    { title: '编排名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '描述', dataIndex: 'description', key: 'description', width: 200,
      render: (v: string) => v || <span className="text-gray-400">-</span> },
    {
      title: '包含模板', dataIndex: 'items', key: 'items', width: 300,
      render: (items: ScheduleItem[]) => (
        <div className="flex flex-wrap gap-1">
          {items?.map((item, i) => (
            <Tag key={i} color="blue" className="text-xs">
              {i + 1}. {item.template_name || `模板${item.template_id}`}
            </Tag>
          ))}
        </div>
      )
    },
    {
      title: '执行统计', key: 'stats', width: 120,
      render: (_: any, r: TaskSchedule) => (
        <span className="text-xs">
          共{r.total_executions || 0}次
          {r.failed_executions > 0 && (
            <span className="text-red-500 ml-1">({r.failed_executions}失败)</span>
          )}
        </span>
      )
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 70,
      render: (v: string) => {
        const m = statusMap[v] || { text: v, color: 'default' };
        return <Tag color={m.color}>{m.text}</Tag>;
      }
    },
    {
      title: '操作', dataIndex: 'id', key: 'action', width: 220,
      render: (_: any, r: TaskSchedule) => (
        <div className="flex space-x-1 flex-wrap">
          <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs"
            onClick={() => { setSelectedSchedule(r); setDetailVisible(true); }}>查看</button>
          <button className="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded text-xs"
            onClick={() => { setSelectedSchedule(r); setSelectedHostId(''); setHostSearch(''); setExecuteVisible(true); }}>执行</button>
          <button className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1 rounded text-xs"
            onClick={() => {
              setSelectedSchedule(r);
              setIsEditing(true);
              setSelectedTemplateIds(r.items?.map(i => i.template_id) || []);
              form.setFieldsValue({
                name: r.name,
                description: r.description,
                schedule_type: r.schedule_type,
                cron_expression: r.cron_expression,
              });
              setEditVisible(true);
            }}>编辑</button>
          <button className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-xs"
            onClick={() => handleDelete(r.id)}>删除</button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">任务编排</h1>
        <p className="mt-1 text-sm text-gray-500">编排多个作业模板，按顺序执行。同一模板可重复添加。</p>
      </div>

      {/* 操作栏 */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex space-x-2">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
              onClick={() => {
                setSelectedSchedule(null);
                setIsEditing(false);
                setSelectedTemplateIds([]);
                form.resetFields();
                form.setFieldsValue({ schedule_type: 'immediate' });
                setEditVisible(true);
              }}>
              <i className="fa fa-plus mr-2"></i>新建编排
            </button>
            <button className="px-4 py-2 border rounded-md hover:bg-gray-100 flex items-center" onClick={loadData}>
              <i className="fa fa-refresh mr-2"></i>刷新
            </button>
          </div>
          <div className="flex gap-2">
            <Input.Search placeholder="搜索编排名称/描述" style={{ width: 220 }}
              onSearch={v => setSearchKeyword(v)} />
          </div>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="bg-white rounded-lg shadow-sm">
        <DataTable
          columns={columns as any}
          dataSource={filteredSchedules}
          loading={loading}
          pagination={{ ...pagination, onChange: (p: number, ps: number) => setPagination(prev => ({ ...prev, current: p, pageSize: ps || 10 })) } as any}
          rowKey="id"
        />
      </div>

      {/* 详情模态框 */}
      <Modal visible={detailVisible} onCancel={() => setDetailVisible(false)} title="编排详情" width={800} footer={null}>
        {selectedSchedule && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">编排ID：</span>
                <span className="font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                  {formatTaskId('Sched', selectedSchedule.id)}
                </span>
              </div>
              <div><span className="text-gray-500">名称：</span><span className="font-medium">{selectedSchedule.name}</span></div>
              <div><span className="text-gray-500">描述：</span><span>{selectedSchedule.description || '-'}</span></div>
              <div><span className="text-gray-500">状态：</span><Tag color="green">{selectedSchedule.status}</Tag></div>
              <div><span className="text-gray-500">执行次数：</span><span>{selectedSchedule.total_executions || 0}</span></div>
              <div><span className="text-gray-500">失败次数：</span><span className={selectedSchedule.failed_executions > 0 ? 'text-red-500' : ''}>{selectedSchedule.failed_executions || 0}</span></div>
            </div>

            {/* 模板列表 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">编排模板（按顺序执行）</h4>
              <div className="space-y-1">
                {selectedSchedule.items?.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded text-sm">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-medium">{i + 1}</span>
                    <span>{item.template_name || `模板${item.template_id}`}</span>
                    <span className="text-xs text-gray-400">(ID: {item.template_id})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end p-4 space-x-2">
          <button className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setDetailVisible(false)}>关闭</button>
        </div>
      </Modal>

      {/* 编辑模态框 */}
      <Modal visible={editVisible} onCancel={() => setEditVisible(false)}
        title={isEditing ? '编辑编排' : '新建编排'} width={700} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="编排名称" rules={[{ required: true, message: '请输入编排名称' }]}>
            <Input placeholder="例如：日常巡检+备份" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="描述此编排的目的和流程" rows={2} />
          </Form.Item>

          {/* 模板选择器 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">添加作业模板（可重复）</label>
            <div className="flex gap-2 mb-2">
              <Select
                placeholder="选择模板"
                style={{ width: 300 }}
                value={addTemplateId}
                onChange={v => setAddTemplateId(v)}
                showSearch
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {templates.map(t => (
                  <Option key={t.id} value={Number(t.id)}>{t.name}</Option>
                ))}
              </Select>
              <button type="button" className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                onClick={handleAddTemplate} disabled={!addTemplateId}>
                <i className="fa fa-plus mr-1"></i>添加
              </button>
            </div>

            {/* 已添加的模板列表 */}
            {selectedTemplateIds.length > 0 && (
              <div className="border rounded p-2 space-y-1 max-h-64 overflow-y-auto">
                <div className="text-xs text-gray-500 mb-2">执行顺序（可上下移动调整）：</div>
                {selectedTemplateIds.map((tid, i) => {
                  const tpl = templates.find(t => Number(t.id) === tid);
                  return (
                    <div key={i} className="flex items-center gap-2 px-2 py-1 bg-blue-50 rounded text-sm">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs">{i + 1}</span>
                      <span className="flex-1">{tpl?.name || `模板${tid}`}</span>
                      <button type="button" className="text-gray-400 hover:text-gray-600 px-1"
                        onClick={() => handleMoveUp(i)} title="上移" disabled={i === 0}>
                        <i className="fa fa-arrow-up text-xs"></i>
                      </button>
                      <button type="button" className="text-gray-400 hover:text-gray-600 px-1"
                        onClick={() => handleMoveDown(i)} title="下移" disabled={i === selectedTemplateIds.length - 1}>
                        <i className="fa fa-arrow-down text-xs"></i>
                      </button>
                      <button type="button" className="text-red-400 hover:text-red-600 px-1"
                        onClick={() => handleRemoveTemplate(i)} title="删除">
                        <i className="fa fa-times text-xs"></i>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Form.Item name="schedule_type" label="执行方式" initialValue="immediate">
            <Select>
              <Option value="immediate">立即执行</Option>
              <Option value="scheduled">定时执行</Option>
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.schedule_type !== c.schedule_type}>
            {({ getFieldValue }) => getFieldValue('schedule_type') === 'scheduled' && (
              <Form.Item name="cron_expression" label="Cron 规则" rules={[{ required: true }]}>
                <Input placeholder="例如: 0 0 * * * (每天零点)" />
              </Form.Item>
            )}
          </Form.Item>
        </Form>
      </Modal>

      {/* 执行确认模态框 */}
      <Modal visible={executeVisible} onCancel={() => setExecuteVisible(false)} title="确认执行" width={500} footer={null}>
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded text-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                {formatTaskId('Sched', selectedSchedule?.id || 0)}
              </span>
              <span className="font-medium">{selectedSchedule?.name}</span>
            </div>
            <span className="text-gray-500 text-xs">将按顺序执行以下模板中的脚本</span>
          </div>

          {/* 包含模板 */}
          <div>
            <div className="space-y-1">
              {selectedSchedule?.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded text-sm">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-medium">{i + 1}</span>
                  <span>{item.template_name || `模板${item.template_id}`}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">目标机器（可选）</label>
            <div className="flex gap-2 mb-2">
              {/* 智能搜索框 */}
              <div className="flex items-center bg-white border border-gray-300 rounded text-sm w-full">
                {/* 搜索输入框 */}
                <div className="flex-1 flex items-center">
                  <input
                    type="text"
                    placeholder={hostFilter.searchField === 'all' ? "搜索所有字段..." : `搜索${getSearchFieldLabel(hostFilter.searchField)}...`}
                    className="flex-1 px-2 py-1 border-0 focus:outline-none focus:ring-0"
                    value={hostFilter.keyword}
                    onChange={e => setHostFilter(p => ({...p, keyword: e.target.value}))}
                    onKeyDown={e => { if (e.key === 'Enter') loadHosts(); }}
                  />
                  {/* 清除按钮 */}
                  {hostFilter.keyword && (
                    <button
                      className="px-2 text-gray-400 hover:text-gray-600"
                      onClick={() => setHostFilter(p => ({...p, keyword: ''}))}
                      title="清除搜索"
                    >
                      <i className="fa fa-times text-xs"></i>
                    </button>
                  )}
                </div>
                
                {/* 匹配模式切换按钮 */}
                <button
                  className={`px-2 py-1 border-l border-gray-200 text-xs ${hostFilter.searchMode === 'exact' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setHostFilter(p => ({...p, searchMode: p.searchMode === 'exact' ? 'fuzzy' : 'exact'}))}
                  title={hostFilter.searchMode === 'exact' ? '精确匹配模式' : '模糊匹配模式'}
                >
                  {hostFilter.searchMode === 'exact' ? '精确' : '模糊'}
                </button>
                
                {/* 字段选择器 */}
                <div className="relative">
                  <select
                    className="appearance-none bg-transparent border-0 pl-1 pr-6 py-1 text-xs text-gray-600 focus:outline-none focus:ring-0 cursor-pointer"
                    value={hostFilter.searchField}
                    onChange={(e) => setHostFilter(p => ({...p, searchField: e.target.value}))}
                  >
                    <option value="all">🔍 所有</option>
                    <option value="name">📝 名称</option>
                    <option value="ip">🌐 IP地址</option>
                    <option value="hostname">🖥️ 主机名</option>
                    <option value="businessLine">🏢 业务线</option>
                    <option value="owner">👤 负责人</option>
                    <option value="sshUsername">👤 SSH用户</option>
                    <option value="sshPort">🔌 SSH端口</option>
                    <option value="tags">🏷️ 标签</option>
                  </select>
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                    <i className="fa fa-chevron-down text-xs"></i>
                  </div>
                </div>
                {/* 搜索按钮 */}
                <button className="px-3 py-1 bg-blue-500 text-white rounded-r text-sm hover:bg-blue-600 border-l border-blue-400"
                  onClick={() => loadHosts()}>搜索</button>
              </div>
            </div>
            {hosts.length > 0 ? (
              <>
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
                  {hosts.map(h => (
                    <div key={h.id}
                      className={`grid grid-cols-12 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${selectedHostId === h.id ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedHostId(h.id)}>
                      {/* 选择列 */}
                      <div className="col-span-1 px-3 py-2 flex items-center justify-center">
                        {selectedHostId === h.id ? (
                          <span className="text-blue-500"><i className="fa fa-check-circle"></i></span>
                        ) : (
                          <span className="text-gray-300"><i className="fa fa-circle"></i></span>
                        )}
                      </div>
                      
                      {/* IP地址列 */}
                      <div className="col-span-2 px-3 py-2 border-l">
                        <div className="font-mono text-xs text-blue-600 truncate" title={h.ip || '无IP'}>
                          {h.ip || '无IP'}
                        </div>
                        <div className="text-xs text-gray-400 truncate" title={h.hostname || '无主机名'}>
                          {h.hostname || '无主机名'}
                        </div>
                      </div>
                      
                      {/* 名称列 */}
                      <div className="col-span-2 px-3 py-2 border-l">
                        <div className="font-medium text-sm truncate" title={h.name}>
                          {h.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate" title={h.owner || '无负责人'}>
                          {h.owner || '无负责人'}
                        </div>
                      </div>
                      
                      {/* 类型列 */}
                      <div className="col-span-1 px-3 py-2 border-l">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                          {getTypeLabel(h.type)}
                        </span>
                      </div>
                      
                      {/* 状态列 */}
                      <div className="col-span-1 px-3 py-2 border-l">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${h.status === 'online' ? 'bg-green-100 text-green-700' : h.status === 'offline' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {h.status === 'online' ? '在线' : h.status === 'offline' ? '离线' : '未知'}
                        </span>
                      </div>
                      
                      {/* 环境列 */}
                      <div className="col-span-2 px-3 py-2 border-l">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${h.environment === 'prod' ? 'bg-red-100 text-red-700' : h.environment === 'test' ? 'bg-blue-100 text-blue-700' : h.environment === 'dev' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {h.environment === 'prod' ? '生产环境' : 
                           h.environment === 'test' ? '测试环境' : 
                           h.environment === 'dev' ? '开发环境' : 
                           h.environment === 'staging' ? '预发布环境' : '未知环境'}
                        </span>
                      </div>
                      
                      {/* 业务线列 */}
                      <div className="col-span-3 px-3 py-2 border-l">
                        <div className="text-sm truncate" title={h.businessLine || '无业务线'}>
                          {h.businessLine || '无业务线'}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {h.tags?.slice(0, 2).map(tag => `#${tag}`).join(' ') || '无标签'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  <span>共 {hosts.length} 台主机</span>
                  {selectedHostId && (
                    <span className="ml-3 text-blue-600">
                      已选择: {hosts.find(h => h.id === selectedHostId)?.name || '未知主机'}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center text-gray-400 py-8 text-sm border rounded">
                <i className="fa fa-server text-2xl mb-2"></i>
                <div>暂无主机数据</div>
                <div className="text-xs mt-1">请调整筛选条件或确保有可用的主机配置</div>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setExecuteVisible(false)}>取消</button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50"
              disabled={executing} onClick={handleExecute}>
              {executing ? '执行中...' : '确认执行'}
            </button>
          </div>
        </div>
      </Modal>


    </div>
  );
};

export default TaskSchedules;