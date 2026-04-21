import React, { useState, useEffect, useMemo } from 'react';
import { message } from 'antd';
import DataTable from '@/components/common/DataTable';
import Modal from '@/components/common/Modal';
import { getExecutionLogs, deleteExecutionLog, ExecutionLog } from '@/api/automation';
import { getJobs } from '@/api/automation';
import { getScripts } from '@/api/scripts';

const formatTaskId = (taskId: number | string): string => `Task-${String(taskId).padStart(10, '0')}`;

// 解析 schedule 类型 output JSON（后端存的是 templates[].scripts[] 结构）
interface ScheduleScript {
  template_id: number;
  template_name: string;
  template_index: number;
  template_total: number;
  script_index: number;
  script_total: number;
  script_id: number;
  script_name: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  success: boolean;
  output: string;
  error: string;
}
interface ScheduleTemplate {
  template_id: number;
  template_name: string;
  template_index: number;
  template_total: number;
  status: string;
  scripts?: ScheduleScript[];
}
interface ScheduleOutput {
  schedule_id: number;
  schedule_name: string;
  schedule_start: string;
  schedule_end: string;
  total_duration_seconds: number;
  templates: ScheduleTemplate[];
}

const parseScheduleOutput = (raw: string): ScheduleOutput | null => {
  try {
    const obj = JSON.parse(raw);
    // 支持旧结构: scripts[] 在根级；新结构: templates[].scripts[] 嵌套
    if (obj && obj.templates && Array.isArray(obj.templates)) {
      // 新结构：扁平化所有脚本，供通用渲染逻辑使用
      const scripts: ScheduleScript[] = [];
      for (const tpl of obj.templates) {
        if (Array.isArray(tpl.scripts)) {
          scripts.push(...tpl.scripts.map((sc: ScheduleScript) => ({
            ...sc,
            template_id: tpl.template_id,
            template_name: tpl.template_name,
            template_index: tpl.template_index,
            template_total: tpl.template_total,
          })));
        }
      }
      return { ...obj, scripts };
    }
    if (obj && obj.schedule_name && obj.scripts) return obj as any;
  } catch { /* not JSON */ }
  return null;
};

const fmtDur = (sec: number): string => {
  if (!sec && sec !== 0) return '-';
  if (sec < 60) return `${sec.toFixed(1)}s`;
  if (sec < 3600) return `${(sec / 60).toFixed(1)}m`;
  return `${(sec / 3600).toFixed(1)}h`;
};

const fmtTime = (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-';

const statusMap: Record<string, { label: string; color: string }> = {
  running: { label: '执行中', color: 'blue' },
  success: { label: '成功',   color: 'green' },
  SUCCESS: { label: '成功',   color: 'green' },
  failed:  { label: '失败',   color: 'red' },
  FAILED:  { label: '失败',   color: 'red' },
};

const sourceMap: Record<string, { label: string; color: string }> = {
  script:   { label: '脚本管理',  color: 'blue' },
  job:      { label: '作业管理',  color: 'green' },
  schedule: { label: '任务编排',  color: 'purple' },
};

const ExecutionLogs: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState('');

  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ExecutionLog | null>(null);
  const [expandedScripts, setExpandedScripts] = useState<Set<string>>(new Set());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsData, jobsData, scriptsData] = await Promise.all([
        getExecutionLogs(),
        getJobs().catch(() => []),
        getScripts().catch(() => []),
      ]);
      setLogs(logsData || []);
      setJobs(jobsData || []);
      setScripts(scriptsData || []);
      setPagination(prev => ({ ...prev, total: (logsData || []).length }));
    } catch { message.error('加载数据失败'); }
    finally { setLoading(false); }
  };

  const getJobName = (jobId?: number) => {
    if (!jobId) return null;
    return jobs.find(j => String(j.id) === String(jobId))?.name || null;
  };
  const getScriptName = (scriptId?: number) => {
    if (!scriptId) return null;
    return scripts.find(s => String(s.id) === String(scriptId))?.name || null;
  };

  const calcDuration = (log: ExecutionLog): string => {
    if (!log.start_time || !log.end_time) return '-';
    const ms = new Date(log.end_time).getTime() - new Date(log.start_time).getTime();
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}秒`;
    return `${(ms / 60000).toFixed(1)}分钟`;
  };

  const columns = [
    {
      title: 'TaskID', dataIndex: 'task_id', key: 'task_id', width: 155,
      render: (v: number) => (
        <span className="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{formatTaskId(v)}</span>
      ),
    },
    {
      title: '来源', dataIndex: 'execution_type', key: 'execution_type', width: 95,
      render: (v: string) => {
        const m = sourceMap[v] || { label: v, color: 'default' };
        return <span className={`inline-block text-xs px-2 py-0.5 rounded font-medium bg-${m.color}-100 text-${m.color}-700`}>{m.label}</span>;
      },
    },
    {
      title: '任务名称', dataIndex: 'name', key: 'name', width: 150,
      render: (_: any, r: ExecutionLog) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm truncate">{r.name}</span>
          {r.execution_type === 'job' && r.job_id && (
            <span className="text-xs text-gray-400">Job-{r.job_id} · {getJobName(r.job_id) || '-'}</span>
          )}
          {r.execution_type === 'script' && r.script_id && (
            <span className="text-xs text-gray-400">Script-{r.script_id} · {getScriptName(r.script_id) || '-'}</span>
          )}
        </div>
      ),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 75,
      render: (v: string) => {
        const m = statusMap[v] || { label: v, color: 'default' };
        return <span className={`inline-block text-xs px-2 py-0.5 rounded font-medium bg-${m.color}-100 text-${m.color}-700`}>{m.label}</span>;
      },
    },
    {
      title: '执行人', dataIndex: 'creator', key: 'creator', width: 75,
      render: (v: string) => <span className="text-xs text-gray-500">{v || 'admin'}</span>,
    },
    {
      title: '开始时间', dataIndex: 'start_time', key: 'start_time', width: 155,
      render: (v: string) => v ? <span className="text-xs text-gray-500">{new Date(v).toLocaleString()}</span> : '-',
    },
    {
      title: '耗时', dataIndex: 'start_time', key: 'duration', width: 75,
      render: (_: any, r: ExecutionLog) => <span className="text-xs text-gray-600">{calcDuration(r)}</span>,
    },
    {
      title: '操作', dataIndex: 'id', key: 'action', width: 100,
      render: (_: any, r: ExecutionLog) => (
        <div className="flex space-x-1">
          <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs" onClick={() => { setSelectedLog(r); setExpandedScripts(new Set()); setDetailVisible(true); }}>详情</button>
          <button className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-xs" onClick={() => handleDelete(r.id)}>删除</button>
        </div>
      ),
    },
  ];

  const handleDelete = async (id: string) => {
    if (!window.confirm('确认删除该执行日志？')) return;
    try { await deleteExecutionLog(id); message.success('删除成功'); loadData(); }
    catch { message.error('删除失败'); }
  };

  const filteredLogs = useMemo(() => logs.filter(l => {
    if (filterType && l.execution_type !== filterType) return false;
    if (filterStatus && l.status !== filterStatus) return false;
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      return (
        formatTaskId(l.task_id).toLowerCase().includes(kw) ||
        l.name.toLowerCase().includes(kw) ||
        (getJobName(l.job_id) || '').toLowerCase().includes(kw) ||
        (getScriptName(l.script_id) || '').toLowerCase().includes(kw)
      );
    }
    return true;
  }), [logs, filterType, filterStatus, searchKeyword]);

  const scheduleData = useMemo(() => {
    if (!selectedLog || selectedLog.execution_type !== 'schedule') return null;
    return parseScheduleOutput(selectedLog.output || '');
  }, [selectedLog]);

  const toggleScript = (key: string) => {
    setExpandedScripts(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // 渲染 schedule 类型详情（JSON 结构）
  const renderScheduleDetail = (data: ScheduleOutput) => {
    const { templates, total_duration_seconds, schedule_start, schedule_end } = data;

    // 计算每个模板的统计信息
    const templateStats = templates.map(tpl => {
      const scripts = tpl.scripts || [];
      const tplDur = scripts.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
      const tplOk = scripts.length === 0 ? true : scripts.every(s => s.success);
      const hasScripts = scripts.length > 0;
      
      return {
        ...tpl,
        scripts,
        tplDur,
        tplOk,
        hasScripts,
        firstScriptStart: scripts[0]?.start_time,
        lastScriptEnd: scripts[scripts.length - 1]?.end_time
      };
    });

    // 计算脚本总数
    const totalScripts = templateStats.reduce((sum, tpl) => sum + tpl.scripts.length, 0);

    return (
      <div className="space-y-3">

        {/* 模板 / 脚本 嵌套表格 */}
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">执行详情</div>
        <div className="rounded-lg overflow-hidden border">

          {/* 表头 */}
          <div className="flex items-center px-4 py-2.5 bg-gray-100 text-xs font-bold text-gray-600 border-b">
            <span className="w-10 text-center flex-shrink-0">序号</span>
            <span className="flex-1 min-w-0">名称</span>
            <div className="flex justify-between flex-shrink-0 w-[600px]">
              <span className="text-center w-32">开始时间</span>
              <span className="text-center w-32">结束时间</span>
              <span className="text-center w-20">耗时</span>
              <span className="text-center w-16">状态</span>
            </div>
          </div>

          {templateStats.map((tpl, index) => {
            const { template_id, template_name, scripts, tplDur, tplOk, hasScripts, firstScriptStart, lastScriptEnd } = tpl;
            
            return (
              <div key={template_id}>
                {/* 模板行（父行） - 浅紫色背景 */}
                <div className="flex items-center px-4 py-2.5 bg-purple-50 border-b text-xs font-semibold text-purple-800">
                  <span className="w-10 text-center flex-shrink-0">{tpl.template_index || index + 1}/{tpl.template_total || templates.length}</span>
                  <span className="flex-1 min-w-0 flex items-center gap-1.5">
                    <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded flex-shrink-0">模板</span>
                    <span className="truncate">{template_name}</span>
                    <span className="text-purple-600 font-normal flex-shrink-0">({scripts.length}个脚本)</span>
                  </span>
                  <div className="flex justify-between flex-shrink-0 w-[600px]">
                    <span className="text-center text-purple-700 whitespace-nowrap w-32">
                      {firstScriptStart ? fmtTime(firstScriptStart) : '-'}
                    </span>
                    <span className="text-center text-purple-700 whitespace-nowrap w-32">
                      {lastScriptEnd ? fmtTime(lastScriptEnd) : '-'}
                    </span>
                    <span className="text-center font-bold text-purple-800 whitespace-nowrap w-20">{fmtDur(tplDur)}</span>
                    <span className="text-center whitespace-nowrap w-16">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        !hasScripts ? 'bg-gray-500 text-white' : (tplOk ? 'bg-green-500 text-white' : 'bg-red-500 text-white')
                      }`}>
                        {hasScripts ? (tplOk ? '成功' : '失败') : '未执行'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* 脚本行 - 只在有脚本时显示 */}
                {scripts.length > 0 && scripts.map((s) => {
                  const rowKey = `${s.template_index || tpl.template_index || index + 1}-${s.script_index}`;
                  const expanded = expandedScripts.has(rowKey);
                  return (
                    <div key={rowKey}>
                      <div
                        className={`flex items-center px-4 py-2 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${expanded ? 'bg-gray-50' : ''}`}
                        onClick={() => toggleScript(rowKey)}
                      >
                        <span className="w-10 text-center text-gray-400 font-mono flex-shrink-0">{s.script_index}/{s.script_total}</span>
                        <span className="flex-1 min-w-0 flex items-center gap-1.5">
                          <i className={`fa ${expanded ? 'fa-caret-down' : 'fa-caret-right'} text-gray-400 text-[10px] flex-shrink-0`}></i>
                          <span className="text-gray-700 text-xs truncate">{s.script_name}</span>
                          <span className="text-gray-400 text-[10px] font-mono flex-shrink-0">#S{s.script_id}</span>
                        </span>
                        <div className="flex justify-between flex-shrink-0 w-[600px]">
                          <span className="text-center text-xs text-gray-500 whitespace-nowrap w-32">{fmtTime(s.start_time)}</span>
                          <span className="text-center text-xs text-gray-500 whitespace-nowrap w-32">{fmtTime(s.end_time)}</span>
                          <span className="text-center text-xs font-medium text-gray-700 whitespace-nowrap w-20">{fmtDur(s.duration_seconds)}</span>
                          <span className="text-center whitespace-nowrap w-16">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${s.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {s.success ? '成功' : '失败'}
                            </span>
                          </span>
                        </div>
                      </div>
                      {/* 展开：脚本输出（自动 pretty-print JSON，方便阅读） */}
                      {expanded && (
                        <div className="border-b last:border-b-0 bg-gray-900 px-5 py-3 max-h-72 overflow-auto">
                          {s.output ? (
                            (() => {
                              try {
                                const parsed = JSON.parse(s.output);
                                return <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap leading-relaxed">{JSON.stringify(parsed, null, 2)}</pre>;
                              } catch {
                                return <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap leading-relaxed">{s.output}</pre>;
                              }
                            })()
                          ) : s.error ? (
                            <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap leading-relaxed">{s.error}</pre>
                          ) : (
                            <div className="text-xs text-gray-500 italic">无输出</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* 无脚本时的提示 */}
                {scripts.length === 0 && (
                  <div className="flex items-center px-4 py-3 border-b bg-gray-50">
                    <span className="w-10 text-center flex-shrink-0"></span>
                    <span className="flex-1 min-w-0 text-xs text-gray-500 italic">该模板没有执行任何脚本</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* 表尾汇总 */}
          <div className="flex items-center px-4 py-2.5 bg-purple-100 text-xs font-bold text-purple-800 border-t-2 border-purple-200">
            <span className="w-10 text-center flex-shrink-0"></span>
            <span className="flex-1 min-w-0">合计 {templates.length} 个模板 · {totalScripts} 个脚本</span>
            <div className="flex justify-between flex-shrink-0 w-[600px]">
              <span className="text-center text-purple-700 whitespace-nowrap w-32">{fmtTime(schedule_start)}</span>
              <span className="text-center text-purple-700 whitespace-nowrap w-32">{fmtTime(schedule_end)}</span>
              <span className="text-center text-purple-800 whitespace-nowrap w-20">{fmtDur(total_duration_seconds)}</span>
              <span className="text-center whitespace-nowrap w-16">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  selectedLog?.status === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {statusMap[selectedLog?.status || '']?.label || selectedLog?.status}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染原始输出（非 schedule）
  const renderRawOutput = (output: string, log: ExecutionLog) => {
    if (!output) return (
      <div className="text-center py-8 text-gray-400 text-sm">
        <i className="fa fa-file-text-o text-2xl mb-2 block"></i>暂无输出内容
      </div>
    );
    // 尝试按 [N/M] 格式解析作业输出
    const lines = output.split('\n');
    const scriptRows: { index: number; total: number; name: string; status: string; output: string; isText: boolean }[] = [];
    let cur: Partial<typeof scriptRows[0]> = {};
    for (const line of lines) {
      const m = line.match(/^\[(\d+)\/(\d+)\] (.+)/);
      if (m) {
        if (cur.name) scriptRows.push(cur as any);
        cur = { index: parseInt(m[1]), total: parseInt(m[2]), name: m[3], status: 'running', output: '', isText: true };
        continue;
      }
      if (line.startsWith('  Status: ')) { cur.status = line.replace('  Status: ', '').trim(); continue; }
      if (line.startsWith('  Output: ')) { cur.output = line.replace('  Output: ', '').trim(); continue; }
      if (line.startsWith('  Error: ')) { cur.output = line.replace('  Error: ', '').trim(); cur.status = 'FAILED'; continue; }
    }
    if (cur.name) scriptRows.push(cur as any);

    if (scriptRows.length === 0) {
      return <div className="bg-gray-900 rounded p-4 overflow-auto max-h-96"><pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{output}</pre></div>;
    }

    return (
      <div className="space-y-2">
        {scriptRows.map((s, i) => {
          const key = `s-${i}`;
          const expanded = expandedScripts.has(key);
          const ok = s.status === 'SUCCESS';
          return (
            <div key={i}>
              <div className={`flex items-center gap-3 px-4 py-2 rounded cursor-pointer hover:bg-gray-50 ${expanded ? 'bg-gray-50' : ''}`} onClick={() => toggleScript(key)}>
                <span className="text-xs font-mono text-gray-400 w-10">{s.index}/{s.total}</span>
                <span className="flex-1 font-medium text-sm">{s.name}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{ok ? '成功' : '失败'}</span>
                <i className={`fa ${expanded ? 'fa-caret-down' : 'fa-caret-right'} text-gray-400 text-xs`}></i>
              </div>
              {expanded && s.output && (
                <div className="bg-gray-900 rounded px-4 py-3 max-h-48 overflow-auto ml-4 border-l-2 border-gray-600">
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{s.output}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">执行日志</h1>
        <p className="mt-1 text-sm text-gray-500">记录所有脚本和作业的执行历史，每次执行产生一条日志</p>
      </div>

      {/* 操作栏 */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex space-x-2">
            <button className="px-4 py-2 border rounded-md hover:bg-gray-100 flex items-center" onClick={loadData}>
              <i className="fa fa-refresh mr-2"></i>刷新
            </button>
          </div>
          <div className="flex gap-2">
            <select className="border rounded px-3 py-1.5 text-sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">全部来源</option>
              <option value="script">脚本管理</option>
              <option value="job">作业管理</option>
              <option value="schedule">任务编排</option>
            </select>
            <select className="border rounded px-3 py-1.5 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">全部状态</option>
              <option value="running">执行中</option>
              <option value="success">成功</option>
              <option value="failed">失败</option>
            </select>
            <div className="relative">
              <input type="text" placeholder="搜索 TaskID / 名称" className="border rounded px-3 py-1.5 text-sm pl-8 w-52"
                value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} />
              <i className="fa fa-search absolute left-2.5 top-2 text-gray-400 text-xs"></i>
            </div>
          </div>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="bg-white rounded-lg shadow-sm">
        <DataTable
          columns={columns as any}
          dataSource={filteredLogs}
          loading={loading}
          pagination={{ ...pagination, onChange: (p: number, ps: number) => setPagination(prev => ({ ...prev, current: p, pageSize: ps || 10 })) } as any}
          rowKey="id"
        />
      </div>

      {/* 详情模态框 */}
      <Modal
        visible={detailVisible}
        onCancel={() => { setDetailVisible(false); setExpandedScripts(new Set()); }}
        title={`执行详情  ${selectedLog ? formatTaskId(selectedLog.task_id) : ''}`}
        width={900}
        footer={null}
      >
        {selectedLog && (
          <div className="space-y-4">

            {/* 概览行 */}
            <div className="flex items-center gap-6 text-sm bg-gray-50 rounded px-4 py-3">
              <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${selectedLog.execution_type === 'script' ? 'bg-blue-600' : selectedLog.execution_type === 'job' ? 'bg-green-600' : 'bg-purple-600'}`}>
                {sourceMap[selectedLog.execution_type]?.label || selectedLog.execution_type}
              </span>
              <span className="font-semibold text-gray-900">{selectedLog.name}</span>
              <span className="text-gray-500"><i className="fa fa-clock-o mr-1"></i>{calcDuration(selectedLog)}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${selectedLog.status === 'success' || selectedLog.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : selectedLog.status === 'failed' || selectedLog.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                {statusMap[selectedLog.status]?.label || selectedLog.status}
              </span>
              <span className="text-gray-400 text-xs ml-auto">{selectedLog.start_time ? new Date(selectedLog.start_time).toLocaleString() : '-'}</span>
            </div>

            {/* 内容：schedule 走 JSON 结构，其他走原始解析 */}
            {selectedLog.execution_type === 'schedule' && scheduleData
              ? renderScheduleDetail(scheduleData)
              : renderRawOutput(selectedLog.output || '', selectedLog)
            }

            {/* 错误信息 */}
            {selectedLog.error && (
              <div className="bg-red-950 rounded p-4">
                <div className="text-xs text-red-400 mb-1 font-bold">错误</div>
                <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap">{selectedLog.error}</pre>
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end p-4 space-x-2 border-t">
          <button className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setDetailVisible(false); setExpandedScripts(new Set()); }}>关闭</button>
        </div>
      </Modal>
    </div>
  );
};

export default ExecutionLogs;
