import React, { useState, useEffect } from 'react';
import { message, Tag, Select, Input, Form } from 'antd';
import DataTable from '@/components/common/DataTable';
import Modal from '@/components/common/Modal';
import { getJobTemplates, createJobTemplate, updateJobTemplate, deleteJobTemplate, JobTemplate, JobTemplateCreate } from '@/api/automation';
import { getScripts, Script } from '@/api/scripts';
import { createJob, JobCreate } from '@/api/automation';

const { Option } = Select;
const { TextArea } = Input;

const JobTemplates: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Modal states
  const [detailVisible, setDetailVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [jobModalVisible, setJobModalVisible] = useState(false);
  const [selected, setSelected] = useState<JobTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 编辑表单
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCron, setFormCron] = useState('');
  const [formStatus, setFormStatus] = useState('enabled');
  const [formScriptIds, setFormScriptIds] = useState<number[]>([]);

  // 脚本选择面板
  const [scriptSearch, setScriptSearch] = useState('');
  const [scriptPickerOpen, setScriptPickerOpen] = useState(false);

  // 创建作业
  const [jobName, setJobName] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [td, sd] = await Promise.all([getJobTemplates(), getScripts()]);
      setTemplates(td || []);
      setScripts(sd || []);
      setPagination(p => ({ ...p, total: (td || []).length }));
    } catch { message.error('加载数据失败'); }
    finally { setLoading(false); }
  };

  const getScriptName = (id: number) => {
    const s = scripts.find(x => String(x.id) === String(id));
    return s ? s.name : `脚本${id}`;
  };

  const getScriptInfo = (id: number) => {
    const s = scripts.find(x => String(x.id) === String(id));
    return s;
  };

  const getScriptNames = (ids: number[]) => {
    return (ids || []).map(id => getScriptName(id));
  };

  const filteredTemplates = templates.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (searchKeyword && !t.name.toLowerCase().includes(searchKeyword.toLowerCase())) return false;
    return true;
  });

  // 筛选可选脚本（排除已选中的）
  const availableScripts = scripts.filter(s => {
    if (formScriptIds.some(fid => String(fid) === String(s.id))) return false;
    if (!scriptSearch) return true;
    const kw = scriptSearch.toLowerCase();
    return s.name.toLowerCase().includes(kw) || (s.category || '').toLowerCase().includes(kw) || (s.language || '').toLowerCase().includes(kw);
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('确认删除该模板？')) return;
    try { await deleteJobTemplate(id); message.success('删除成功'); loadData(); }
    catch { message.error('删除失败'); }
  };

  const handleSave = async () => {
    if (!formName.trim()) { message.error('请输入模板名称'); return; }
    if (formScriptIds.length === 0) { message.error('请至少编排一个脚本'); return; }
    try {
      const data: JobTemplateCreate = {
        name: formName,
        description: formDesc,
        script_ids: formScriptIds,
        cron_expression: formCron || undefined,
        status: formStatus
      };
      if (isEditing && selected) {
        await updateJobTemplate(selected.id, data);
        message.success('更新成功');
      } else {
        await createJobTemplate(data);
        message.success('创建成功');
      }
      setEditVisible(false);
      loadData();
    } catch { message.error('保存失败'); }
  };

  const handleCreateJob = async () => {
    if (!selected) return;
    if (!jobName.trim()) { message.error('请输入作业名称'); return; }
    try {
      const data: JobCreate = {
        name: jobName,
        template_id: parseInt(selected.id),
        job_type: 'immediate',
        status: 'pending'
      };
      await createJob(data);
      message.success('作业创建成功');
      setJobModalVisible(false);
    } catch { message.error('创建作业失败'); }
  };

  // 打开编辑
  const openEdit = (t: JobTemplate | null) => {
    if (t) {
      setSelected(t);
      setIsEditing(true);
      setFormName(t.name);
      setFormDesc(t.description || '');
      setFormCron(t.cron_expression || '');
      setFormStatus(t.status);
      setFormScriptIds(t.script_ids || []);
    } else {
      setSelected(null);
      setIsEditing(false);
      setFormName('');
      setFormDesc('');
      setFormCron('');
      setFormStatus('enabled');
      setFormScriptIds([]);
    }
    setScriptSearch('');
    setScriptPickerOpen(false);
    setEditVisible(true);
  };

  // 脚本编排操作
  const addScript = (id: number) => {
    setFormScriptIds(prev => [...prev, id]);
  };

  const removeScript = (index: number) => {
    setFormScriptIds(prev => prev.filter((_, i) => i !== index));
  };

  const moveScriptUp = (index: number) => {
    if (index === 0) return;
    setFormScriptIds(prev => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  };

  const moveScriptDown = (index: number) => {
    if (index >= formScriptIds.length - 1) return;
    setFormScriptIds(prev => {
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  };

  const columns = [
    { title: '模板名称', dataIndex: 'name' as keyof JobTemplate, key: 'name', width: 180 },
    {
      title: '关联脚本', dataIndex: 'script_ids' as keyof JobTemplate, key: 'scripts', width: 200,
      render: (_: any, r: JobTemplate) => (
        <div className="flex flex-wrap gap-1">
          {getScriptNames(r.script_ids || []).map((n, i) => <Tag key={i} color="blue">{i + 1}. {n}</Tag>)}
        </div>
      )
    },
    { title: '定时规则', dataIndex: 'cron_expression' as keyof JobTemplate, key: 'cron', width: 140, render: (v: string) => v || <span className="text-gray-400">-</span> },
    {
      title: '状态', dataIndex: 'status' as keyof JobTemplate, key: 'status', width: 80,
      render: (v: string) => <Tag color={v === 'enabled' ? 'green' : 'red'}>{v === 'enabled' ? '启用' : '禁用'}</Tag>
    },
    { title: '创建人', dataIndex: 'creator' as keyof JobTemplate, key: 'creator', width: 100 },
    {
      title: '创建时间', dataIndex: 'create_time' as keyof JobTemplate, key: 'create_time', width: 160,
      render: (v: string) => v ? new Date(v).toLocaleString() : <span className="text-gray-400">-</span>
    },
    {
      title: '操作', dataIndex: 'id' as keyof JobTemplate, key: 'action', width: 220,
      render: (_: any, r: JobTemplate) => (
        <div className="flex space-x-1 flex-wrap">
          <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs" onClick={() => { setSelected(r); setDetailVisible(true); }}>查看</button>
          <button className="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded text-xs" onClick={() => { setSelected(r); setJobName(`${r.name}-作业`); setJobModalVisible(true); }}>创建作业</button>
          <button className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1 rounded text-xs" onClick={() => openEdit(r)}>编辑</button>
          <button className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-xs" onClick={() => handleDelete(r.id)}>删除</button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">作业模板</h1>
        <p className="mt-1 text-sm text-gray-500">管理作业模板，编排脚本执行顺序并快速创建作业</p>
      </div>

      {/* 操作栏 */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex space-x-2">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center" onClick={() => openEdit(null)}>
              <i className="fa fa-plus mr-2"></i>新建模板
            </button>
            <button className="px-4 py-2 border rounded-md hover:bg-gray-100 flex items-center" onClick={loadData}>
              <i className="fa fa-refresh mr-2"></i>刷新
            </button>
          </div>
          <div className="flex gap-2">
            <Select placeholder="状态" allowClear style={{ width: 120 }} value={filterStatus || undefined} onChange={v => setFilterStatus(v || '')}>
              <Option value="enabled">启用</Option><Option value="disabled">禁用</Option>
            </Select>
            <Input.Search placeholder="搜索模板" style={{ width: 200 }} onSearch={v => setSearchKeyword(v)} />
          </div>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="bg-white rounded-lg shadow-sm">
        <DataTable
          columns={columns as any}
          dataSource={filteredTemplates}
          loading={loading}
          pagination={{ ...pagination, onChange: (p: number, ps: number) => setPagination(prev => ({ ...prev, current: p, pageSize: ps || 10 })) } as any}
          rowKey="id"
        />
      </div>

      {/* 详情模态框 */}
      <Modal visible={detailVisible} onCancel={() => setDetailVisible(false)} title="模板详情" width={700} footer={null}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">模板名称：</span><span className="font-medium">{selected.name}</span></div>
              <div><span className="text-gray-500">状态：</span><Tag color={selected.status === 'enabled' ? 'green' : 'red'}>{selected.status === 'enabled' ? '启用' : '禁用'}</Tag></div>
              <div><span className="text-gray-500">创建人：</span><span>{selected.creator}</span></div>
              <div><span className="text-gray-500">创建时间：</span><span>{selected.create_time ? new Date(selected.create_time).toLocaleString() : '-'}</span></div>
              <div><span className="text-gray-500">定时规则：</span><span>{selected.cron_expression || '-'}</span></div>
            </div>
            {selected.description && <div><span className="text-gray-500">描述：</span><span>{selected.description}</span></div>}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">脚本编排（按顺序执行）</h4>
              <div className="space-y-1">
                {(selected.script_ids || []).map((id, i) => {
                  const info = getScriptInfo(id);
                  return (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded text-sm">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-medium">{i + 1}</span>
                      <span className="font-medium">{info?.name || `脚本${id}`}</span>
                      {info?.category && <span className="text-gray-400 text-xs">{info.category}</span>}
                      {info?.language && <Tag color="geekblue" className="text-xs">{info.language}</Tag>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end p-4 space-x-2">
          <button className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDetailVisible(false)}>关闭</button>
        </div>
      </Modal>

      {/* 编辑模态框 - 脚本编排 */}
      <Modal visible={editVisible} onCancel={() => setEditVisible(false)} title={isEditing ? '编辑模板' : '新建模板'} width={750} footer={null}>
        <div className="space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">模板名称 <span className="text-red-500">*</span></label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="请输入模板名称" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <Select value={formStatus} onChange={v => setFormStatus(v)} style={{ width: '100%' }}>
                <Option value="enabled">启用</Option><Option value="disabled">禁用</Option>
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <TextArea rows={2} value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="请输入描述" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">定时规则 (Cron)</label>
            <Input value={formCron} onChange={e => setFormCron(e.target.value)} placeholder="例如: 0 0 * * * (每天零点)" />
          </div>

          {/* 脚本编排 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">脚本编排 <span className="text-red-500">*</span>
                <span className="text-xs text-gray-400 ml-1">（按顺序执行）</span>
              </label>
              <button
                className="inline-flex items-center px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                onClick={() => { setScriptSearch(''); setScriptPickerOpen(!scriptPickerOpen); }}
              >
                <i className="fa fa-plus mr-1"></i>添加脚本
              </button>
            </div>

            {/* 已编排脚本列表 */}
            {formScriptIds.length > 0 ? (
              <div className="space-y-1 mb-2">
                {formScriptIds.map((id, index) => {
                  const info = getScriptInfo(id);
                  return (
                    <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded border border-gray-200 text-sm group hover:bg-gray-100">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold shrink-0">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900">{info?.name || `脚本${id}`}</span>
                        {info?.category && <span className="text-gray-400 text-xs ml-2">{info.category}</span>}
                        {info?.language && <Tag color="geekblue" className="ml-1 text-xs">{info.language}</Tag>}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1 text-gray-400 hover:text-blue-500 disabled:text-gray-200"
                          onClick={() => moveScriptUp(index)}
                          disabled={index === 0}
                          title="上移"
                        ><i className="fa fa-arrow-up text-xs"></i></button>
                        <button
                          className="p-1 text-gray-400 hover:text-blue-500 disabled:text-gray-200"
                          onClick={() => moveScriptDown(index)}
                          disabled={index === formScriptIds.length - 1}
                          title="下移"
                        ><i className="fa fa-arrow-down text-xs"></i></button>
                        <button
                          className="p-1 text-gray-400 hover:text-red-500"
                          onClick={() => removeScript(index)}
                          title="移除"
                        ><i className="fa fa-times text-xs"></i></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded border-2 border-dashed border-gray-300 text-gray-400 text-sm mb-2">
                <i className="fa fa-puzzle-piece text-2xl mb-2 block"></i>
                点击上方「添加脚本」编排执行流程
              </div>
            )}

            {/* 脚本选择面板 */}
            {scriptPickerOpen && (
              <div className="border rounded-lg bg-white shadow-inner">
                <div className="p-2 border-b bg-gray-50">
                  <Input.Search
                    placeholder="搜索脚本名称 / 分类 / 语言"
                    value={scriptSearch}
                    onChange={e => setScriptSearch(e.target.value)}
                    allowClear
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {availableScripts.length > 0 ? (
                    availableScripts.map(s => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 hover:bg-blue-50 cursor-pointer text-sm"
                        onClick={() => addScript(parseInt(s.id))}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <i className="fa fa-file-code-o text-gray-400"></i>
                          <span className="font-medium text-gray-900 truncate">{s.name}</span>
                          {s.category && <span className="text-gray-400 text-xs">{s.category}</span>}
                          {s.language && <Tag color="geekblue" className="text-xs">{s.language}</Tag>}
                        </div>
                        <i className="fa fa-plus-circle text-blue-400 hover:text-blue-600"></i>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      {scriptSearch ? '没有匹配的脚本' : '没有可选脚本'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="flex justify-end pt-4 border-t space-x-2">
            <button className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50" onClick={() => setEditVisible(false)}>取消</button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600" onClick={handleSave}>
              {isEditing ? '保存' : '创建'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 快速创建作业模态框 */}
      <Modal visible={jobModalVisible} onCancel={() => setJobModalVisible(false)} title="快速创建作业" width={500} footer={null}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">作业名称 <span className="text-red-500">*</span></label>
            <Input value={jobName} onChange={e => setJobName(e.target.value)} placeholder="请输入作业名称" />
          </div>
          <div className="bg-blue-50 p-3 rounded text-sm">
            <span className="text-blue-700">关联模板: <strong>{selected?.name}</strong></span>
            <div className="mt-1 flex flex-wrap gap-1">
              {getScriptNames(selected?.script_ids || []).map((n, i) => (
                <Tag key={i} color="blue">{i + 1}. {n}</Tag>
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50" onClick={() => setJobModalVisible(false)}>取消</button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600" onClick={handleCreateJob}>创建</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default JobTemplates;
