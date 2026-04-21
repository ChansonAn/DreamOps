import React, { useState, useEffect } from 'react';
import { message, Tag, Select, Input, Form } from 'antd';
import DataTable from '@/components/common/DataTable';
import Modal from '@/components/common/Modal';
import { getJobs, createJob, updateJob, deleteJob, executeJob, Job, JobCreate, getExecutionLogs, ExecutionLog } from '@/api/automation';
import { getJobTemplates, JobTemplate } from '@/api/automation';
import { getScripts, Script } from '@/api/scripts';
import { getConfigItems, ConfigurationItem } from '@/api/cmdb';

const { Option } = Select;

// Generate task ID
const formatTaskId = (prefix: string, id: number | string): string => {
  const num = String(id).padStart(10, '0');
  return `${prefix}-${num}`;
};

const JobManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Modal states
  const [detailVisible, setDetailVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [executeVisible, setExecuteVisible] = useState(false);
  const [execResultVisible, setExecResultVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<any>(null);
  const [hosts, setHosts] = useState<ConfigurationItem[]>([]);
  const [selectedHostId, setSelectedHostId] = useState<string>('');
  const [hostSearch, setHostSearch] = useState('');
  const [form] = Form.useForm();

  // Execution logs for detail view
  const [jobLogs, setJobLogs] = useState<ExecutionLog[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsData, templatesData, hostsData, scriptsData] = await Promise.all([
        getJobs(), getJobTemplates(), getConfigItems(), getScripts()
      ]);
      setJobs(jobsData || []);
      setTemplates(templatesData || []);
      setHosts((hostsData || []).filter((h: ConfigurationItem) => ['host','vm','physical','virtualization','cloud','container'].includes(h.type)));
      setScripts(scriptsData || []);
      setPagination(prev => ({ ...prev, total: (jobsData || []).length }));
    } catch { message.error('加载数据失败'); }
    finally { setLoading(false); }
  };

  const getTemplateName = (id?: number) => {
    if (!id) return '-';
    const t = templates.find(x => String(x.id) === String(id));
    return t?.name || `模板${id}`;
  };

  const getScriptName = (id?: number) => {
    if (!id) return '-';
    const s = scripts.find(x => String(x.id) === String(id));
    return s?.name || `脚本${id}`;
  };

  const getTemplateScriptNames = (templateId?: number) => {
    if (!templateId) return [];
    const t = templates.find(x => String(x.id) === String(templateId));
    if (!t?.script_ids) return [];
    return t.script_ids.map(id => getScriptName(id));
  };

  const jobTypeMap: Record<string, { text: string; color: string }> = {
    immediate: { text: '立即执行', color: 'blue' },
    scheduled: { text: '定时执行', color: 'green' },
    manual: { text: '手动触发', color: 'orange' }
  };

  const statusMap: Record<string, { text: string; color: string }> = {
    pending: { text: '待执行', color: 'default' },
    running: { text: '执行中', color: 'processing' },
    success: { text: '成功', color: 'success' },
    failed: { text: '失败', color: 'error' }
  };

  const logStatusMap: Record<string, { text: string; color: string }> = {
    running: { text: '执行中', color: 'processing' },
    success: { text: '成功', color: 'success' },
    failed: { text: '失败', color: 'error' }
  };

  const filteredJobs = jobs.filter(j => {
    if (filterType && j.job_type !== filterType) return false;
    if (filterStatus && j.status !== filterStatus) return false;
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      const taskId = formatTaskId('Job', j.id).toLowerCase();
      return j.name.toLowerCase().includes(kw) || taskId.includes(kw) || getTemplateName(j.template_id).toLowerCase().includes(kw);
    }
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('确认删除该作业？')) return;
    try { await deleteJob(id); message.success('删除成功'); loadData(); }
    catch { message.error('删除失败'); }
  };

  const handleSave = async (values: any) => {
    try {
      const data: JobCreate = {
        name: values.name,
        template_id: values.template_id ? parseInt(values.template_id) : undefined,
        job_type: values.job_type,
        cron_expression: values.cron_expression,
        status: values.status || 'pending'
      };
      if (values.job_type === 'scheduled' && !values.cron_expression) {
        message.error('定时执行需要设置 Cron 规则');
        return;
      }
      if (isEditing && selectedJob) {
        await updateJob(selectedJob.id, data);
        message.success('更新成功');
      } else {
        await createJob(data);
        message.success('创建成功');
      }
      setEditVisible(false);
      loadData();
    } catch { message.error('保存失败'); }
  };

  const handleExecute = async () => {
    if (!selectedJob) return;
    setExecuting(true);
    try {
      const host = hosts.find(h => h.id === selectedHostId);
      const targetIp = host?.ip || undefined;
      const result = await executeJob(selectedJob.id, targetIp);
      setExecResult(result);
      setExecuteVisible(false);
      setExecResultVisible(true);
      setSelectedHostId('');
      loadData();
    } catch (e: any) {
      setExecResult({ success: false, error: e.message || '执行失败' });
      setExecuteVisible(false);
      setExecResultVisible(true);
    }
    finally { setExecuting(false); }
  };

  // Load job execution logs
  const loadJobLogs = async (jobId: string) => {
    try {
      const allLogs = await getExecutionLogs();
      const filtered = (allLogs || []).filter((l: ExecutionLog) => String(l.job_id) === String(jobId));
      setJobLogs(filtered);
    } catch { setJobLogs([]); }
  };

  const columns = [
    {
      title: '任务ID', dataIndex: 'id' as keyof Job, key: 'task_id', width: 180,
      render: (v: any) => (
        <span className="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
          {formatTaskId('Job', v)}
        </span>
      )
    },
    { title: '作业名称', dataIndex: 'name' as keyof Job, key: 'name', width: 150 },
    {
      title: '关联模板', dataIndex: 'template_id' as keyof Job, key: 'template', width: 130,
      render: (_: any, r: Job) => <span className="text-green-700 font-medium">{getTemplateName(r.template_id)}</span>
    },
    {
      title: '包含脚本', dataIndex: 'template_id' as keyof Job, key: 'scripts', width: 180,
      render: (_: any, r: Job) => (
        <div className="flex flex-wrap gap-1">
          {getTemplateScriptNames(r.template_id).map((n, i) => <Tag key={i} color="blue" className="text-xs">{i + 1}. {n}</Tag>)}
        </div>
      )
    },
    {
      title: '作业类型', dataIndex: 'job_type' as keyof Job, key: 'job_type', width: 90,
      render: (v: string) => { const m = jobTypeMap[v] || { text: v, color: 'default' }; return <Tag color={m.color}>{m.text}</Tag>; }
    },
    { title: '定时规则', dataIndex: 'cron_expression' as keyof Job, key: 'cron', width: 120, render: (v: string) => v || <span className="text-gray-400">-</span> },
    {
      title: '状态', dataIndex: 'status' as keyof Job, key: 'status', width: 70,
      render: (v: string) => { const m = statusMap[v] || { text: v, color: 'default' }; return <Tag color={m.color}>{m.text}</Tag>; }
    },
    {
      title: '操作', dataIndex: 'id' as keyof Job, key: 'action', width: 220,
      render: (_: any, r: Job) => (
        <div className="flex space-x-1 flex-wrap">
          <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs" onClick={() => { setSelectedJob(r); loadJobLogs(r.id); setDetailVisible(true); }}>查看</button>
          <button className="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded text-xs" onClick={() => { setSelectedJob(r); setSelectedHostId(''); setHostSearch(''); setExecuteVisible(true); }} disabled={r.status === 'running'}>执行</button>
          <button className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1 rounded text-xs" onClick={() => { setSelectedJob(r); setIsEditing(true); form.setFieldsValue({ name: r.name, template_id: r.template_id?.toString(), job_type: r.job_type, cron_expression: r.cron_expression, status: r.status }); setEditVisible(true); }}>编辑</button>
          <button className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-xs" onClick={() => handleDelete(r.id)}>删除</button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">作业管理</h1>
        <p className="mt-1 text-sm text-gray-500">管理作业调度，支持立即执行、定时执行和手动触发</p>
      </div>

      {/* 操作栏 */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex space-x-2">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center" onClick={() => { setSelectedJob(null); setIsEditing(false); form.resetFields(); form.setFieldsValue({ job_type: 'immediate', status: 'pending' }); setEditVisible(true); }}>
              <i className="fa fa-plus mr-2"></i>新建作业
            </button>
            <button className="px-4 py-2 border rounded-md hover:bg-gray-100 flex items-center" onClick={loadData}>
              <i className="fa fa-refresh mr-2"></i>刷新
            </button>
          </div>
          <div className="flex gap-2">
            <Select placeholder="类型" allowClear style={{ width: 120 }} value={filterType || undefined} onChange={v => setFilterType(v || '')}>
              <Option value="immediate">立即执行</Option><Option value="scheduled">定时执行</Option><Option value="manual">手动触发</Option>
            </Select>
            <Select placeholder="状态" allowClear style={{ width: 120 }} value={filterStatus || undefined} onChange={v => setFilterStatus(v || '')}>
              <Option value="pending">待执行</Option><Option value="running">执行中</Option><Option value="success">成功</Option><Option value="failed">失败</Option>
            </Select>
            <Input.Search placeholder="搜索任务ID/作业名" style={{ width: 220 }} onSearch={v => setSearchKeyword(v)} />
          </div>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="bg-white rounded-lg shadow-sm">
        <DataTable
          columns={columns as any}
          dataSource={filteredJobs}
          loading={loading}
          pagination={{ ...pagination, onChange: (p: number, ps: number) => setPagination(prev => ({ ...prev, current: p, pageSize: ps || 10 })) } as any}
          rowKey="id"
        />
      </div>

      {/* 详情模态框 - 含执行日志 */}
      <Modal visible={detailVisible} onCancel={() => setDetailVisible(false)} title="作业详情" width={800} footer={null}>
        {selectedJob && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">任务ID：</span>
                <span className="font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{formatTaskId('Job', selectedJob.id)}</span>
              </div>
              <div><span className="text-gray-500">作业名称：</span><span className="font-medium">{selectedJob.name}</span></div>
              <div><span className="text-gray-500">关联模板：</span><span className="text-green-700 font-medium">{getTemplateName(selectedJob.template_id)}</span></div>
              <div><span className="text-gray-500">作业类型：</span>{(() => { const m = jobTypeMap[selectedJob.job_type] || { text: selectedJob.job_type, color: 'default' }; return <Tag color={m.color}>{m.text}</Tag>; })()}</div>
              <div><span className="text-gray-500">状态：</span>{(() => { const m = statusMap[selectedJob.status] || { text: selectedJob.status, color: 'default' }; return <Tag color={m.color}>{m.text}</Tag>; })()}</div>
              <div><span className="text-gray-500">创建人：</span><span>{selectedJob.creator}</span></div>
              <div><span className="text-gray-500">定时规则：</span><span>{selectedJob.cron_expression || '-'}</span></div>
              <div><span className="text-gray-500">创建时间：</span><span>{selectedJob.create_time ? new Date(selectedJob.create_time).toLocaleString() : '-'}</span></div>
            </div>

            {/* 包含脚本 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">脚本编排</h4>
              <div className="space-y-1">
                {getTemplateScriptNames(selectedJob.template_id).map((name, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded text-sm">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-medium">{i + 1}</span>
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 执行日志 */}
            {jobLogs.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">执行日志 ({jobLogs.length})</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {jobLogs.map((log, i) => {
                    const m = logStatusMap[log.status] || { text: log.status, color: 'default' };
                    return (
                      <div key={i} className="border rounded p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{formatTaskId('Script', log.id)}</span>
                            <span className="font-medium">{log.name}</span>
                          </div>
                          <Tag color={m.color}>{m.text}</Tag>
                        </div>
                        {log.start_time && (
                          <div className="text-xs text-gray-400">
                            {new Date(log.start_time).toLocaleString()}
                            {log.end_time && ` → ${new Date(log.end_time).toLocaleString()}`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end p-4 space-x-2">
          <button className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDetailVisible(false)}>关闭</button>
        </div>
      </Modal>

      {/* 编辑模态框 */}
      <Modal visible={editVisible} onCancel={() => setEditVisible(false)} title={isEditing ? '编辑作业' : '新建作业'} width={700} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="作业名称" rules={[{ required: true, message: '请输入作业名称' }]}><Input placeholder="请输入作业名称" /></Form.Item>
          <Form.Item name="template_id" label="选择模板"><Select placeholder="请选择模板（可选）" allowClear>{templates.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}</Select></Form.Item>
          <Form.Item name="job_type" label="作业类型" rules={[{ required: true, message: '请选择作业类型' }]}>
            <Select placeholder="请选择作业类型">
              <Option value="immediate">立即执行</Option><Option value="scheduled">定时执行</Option><Option value="manual">手动触发</Option>
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.job_type !== c.job_type}>
            {({ getFieldValue }) => getFieldValue('job_type') === 'scheduled' ? (
              <Form.Item name="cron_expression" label="定时规则 (Cron)" rules={[{ required: true, message: '请输入定时规则' }]}><Input placeholder="例如: 0 0 * * * (每天零点)" /></Form.Item>
            ) : null}
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="pending">
            <Select><Option value="pending">待执行</Option><Option value="running">执行中</Option><Option value="success">成功</Option><Option value="failed">失败</Option></Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 执行确认模态框 */}
      <Modal visible={executeVisible} onCancel={() => setExecuteVisible(false)} title="确认执行" width={500} footer={null}>
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded text-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{formatTaskId('Job', selectedJob?.id || 0)}</span>
              <span className="font-medium">{selectedJob?.name}</span>
            </div>
            <span className="text-gray-500 text-xs">执行记录将保存到执行日志中</span>
          </div>

          {/* 包含脚本 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">将按顺序执行以下脚本</label>
            <div className="space-y-1">
              {getTemplateScriptNames(selectedJob?.template_id).map((name, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded text-sm">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-medium">{i + 1}</span>
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">目标机器（可选，不选则在本地执行）</label>
            {hosts.length > 0 ? (
              <>
                <Input.Search
                  placeholder="搜索主机名称/IP"
                  style={{ marginBottom: 8 }}
                  onSearch={v => setHostSearch(v)}
                  allowClear
                  onChange={e => { if (!e.target.value) setHostSearch(''); }}
                />
                <div className="border rounded max-h-48 overflow-y-auto">
                  {hosts
                    .filter(h => !hostSearch || h.name?.toLowerCase().includes(hostSearch.toLowerCase()) || h.ip?.includes(hostSearch))
                    .map(h => (
                      <div
                        key={h.id}
                        className={`flex items-center justify-between px-3 py-2 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${selectedHostId === h.id ? 'bg-blue-50' : ''}`}
                        onClick={() => setSelectedHostId(h.id)}
                      >
                        <div>
                          <span className="font-medium text-sm">{h.name}</span>
                          <span className="ml-2 text-xs text-gray-500">{h.ip}</span>
                        </div>
                        {h.hostname && <span className="text-xs text-gray-400">{h.hostname}</span>}
                        {selectedHostId === h.id && <span className="text-blue-500"><i className="fa fa-check-circle"></i></span>}
                      </div>
                    ))
                  }
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">暂无CMDB主机数据</p>
            )}
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50" onClick={() => setExecuteVisible(false)}>取消</button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50"
              disabled={executing}
              onClick={handleExecute}
            >{executing ? '执行中...' : '确认执行'}</button>
          </div>
        </div>
      </Modal>

      {/* 执行结果模态框 - 带滚动条 */}
      <Modal visible={execResultVisible} onCancel={() => setExecResultVisible(false)} title="执行结果" width={700} footer={null}>
        {execResult && (
          <div className="space-y-3">
            {/* 概览 */}
            <div className={`p-3 rounded ${execResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2">
                <i className={`fa ${execResult.success ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'} text-lg`}></i>
                <span className={`font-medium ${execResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {execResult.success ? '全部执行成功' : '执行失败'}
                </span>
              </div>
              {execResult.job_name && (
                <div className="mt-1 text-sm text-gray-600">
                  作业: <span className="font-medium">{execResult.job_name}</span>
                  {execResult.template_name && <span className="ml-2">模板: {execResult.template_name}</span>}
                </div>
              )}
              {execResult.scripts_executed !== undefined && (
                <div className="mt-1 text-sm text-gray-500">
                  共执行 {execResult.scripts_executed} 个脚本
                </div>
              )}
            </div>

            {/* 每个脚本的执行结果 */}
            {execResult.results?.map((r: any, i: number) => (
              <div key={i} className={`border rounded overflow-hidden ${r.success ? 'border-gray-200' : 'border-red-200'}`}>
                <div className={`flex items-center justify-between px-3 py-2 ${r.success ? 'bg-gray-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-medium">{i + 1}</span>
                    <span className="font-medium text-sm">{r.script_name || `脚本${r.script_id}`}</span>
                  </div>
                  <Tag color={r.success ? 'green' : 'red'}>{r.success ? '成功' : '失败'}</Tag>
                </div>
                {/* 输出内容 - 可滚动 */}
                {(r.output || r.error) && (
                  <div className="border-t">
                    {r.error && (
                      <pre className="bg-red-950 text-red-300 p-3 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-48">{r.error}</pre>
                    )}
                    {r.output && (
                      <pre className="bg-gray-900 text-green-400 p-3 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-48">{r.output}</pre>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* 单独的错误 */}
            {!execResult.results && execResult.error && (
              <pre className="bg-red-950 text-red-300 p-4 rounded text-xs font-mono whitespace-pre-wrap overflow-auto max-h-64">{execResult.error}</pre>
            )}
          </div>
        )}
        <div className="flex justify-end p-4 space-x-2">
          <button className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50" onClick={() => setExecResultVisible(false)}>关闭</button>
        </div>
      </Modal>
    </div>
  );
};

export default JobManagement;
