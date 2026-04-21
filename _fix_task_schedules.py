# -*- coding: utf-8 -*-
with open(r'I:\APP\dreamops\frontend\src\pages\automation\TaskSchedules.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Build new section
new_section = [
    '          <div>\n',
    '            <label className="block text-sm font-medium text-gray-700 mb-2">目标机器（可选）</label>\n',
    '            <div className="flex gap-2 mb-2 flex-wrap">\n',
    "              <select className=\"flex-1 border rounded px-2 py-1 text-sm\" value={hostFilter.environment}\n",
    '                onChange={e => { const v = e.target.value; setHostFilter(p => ({...p, environment: v})); loadHosts(); }}>\n',
    '                <option value="">全部环境</option>\n',
    '                <option value="dev">开发</option>\n',
    '                <option value="test">测试</option>\n',
    '                <option value="staging">预发布</option>\n',
    '                <option value="prod">生产</option>\n',
    '              </select>\n',
    "              <select className=\"flex-1 border rounded px-2 py-1 text-sm\" value={hostFilter.businessLine}\n",
    '                onChange={e => { const v = e.target.value; setHostFilter(p => ({...p, businessLine: v})); loadHosts(); }}>\n',
    '                <option value="">全部业务线</option>\n',
    '                <option value="IT运维">IT运维</option>\n',
    '                <option value="基础设施平台">基础设施平台</option>\n',
    '                <option value="运维中心">运维中心</option>\n',
    '                <option value="业务支撑">业务支撑</option>\n',
    '              </select>\n',
    "              <input className=\"flex-1 border rounded px-2 py-1 text-sm\" placeholder=\"搜索名称/IP/主机名\"\n",
    "                value={hostFilter.keyword}\n",
    "                onChange={e => setHostFilter(p => ({...p, keyword: e.target.value}))}\n",
    "                onKeyDown={e => { if (e.key === 'Enter') loadHosts(); }} />\n",
    "              <button className=\"px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600\"\n",
    '                onClick={() => loadHosts()}>搜索</button>\n',
    '            </div>\n',
    '            {hosts.length > 0 ? (\n',
    '              <>\n',
    '                <div className="border rounded max-h-48 overflow-y-auto">\n',
    '                  {hosts.map(h => (\n',
    '                    <div key={h.id}\n',
    "                      className={`flex items-center justify-between px-3 py-2 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${selectedHostId === h.id ? 'bg-blue-50' : ''}`}\n",
    '                      onClick={() => setSelectedHostId(h.id)}>\n',
    '                      <div className="flex items-center gap-2 min-w-0">\n',
    '                        <span className="font-medium text-sm truncate">{h.name}</span>\n',
    '                        <span className="text-xs text-gray-400 flex-shrink-0">{h.ip || \'-\'}</span>\n',
    '                        <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${h.environment === \'prod\' ? \'bg-red-100 text-red-700\' : h.environment === \'test\' ? \'bg-blue-100 text-blue-700\' : \'bg-gray-100 text-gray-600\'}`}>{h.environment?.toUpperCase()}</span>\n',
    '                      </div>\n',
    '                      {selectedHostId === h.id && <span className="text-blue-500 flex-shrink-0"><i className="fa fa-check-circle"></i></span>}\n',
    '                    </div>\n',
    '                  ))}\n',
    '                </div>\n',
    '                <div className="text-xs text-gray-400 mt-1">共 {hosts.length} 台{selectedHostId ? \'，已选: \' + (hosts.find(h=>h.id===selectedHostId)?.name || \'\') : \'\'}</div>\n',
    '              </>\n',
    '            ) : (\n',
    '              <p className="text-sm text-gray-400">无匹配的主机，请调整筛选条件</p>\n',
    '            )}\n',
    '          </div>\n',
]

# Find the section: line 430 ('          <div>') to line 456 ('          </div>')
# Lines 429-455 (0-indexed: 429-455 inclusive = lines 430-456 1-indexed)
start = 429  # 0-indexed
end = 455    # 0-indexed (line 456)

# Check
print(f'Lines to replace: {start+1} to {end+1}')
print(f'Line {start+1}: {repr(lines[start])}')
print(f'Line {end+1}: {repr(lines[end])}')

# Replace
new_lines = lines[:start] + new_section + lines[end+1:]

with open(r'I:\APP\dreamops\frontend\src\pages\automation\TaskSchedules.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f'Done. New total lines: {len(new_lines)}')