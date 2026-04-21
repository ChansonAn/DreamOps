# -*- coding: utf-8 -*-
import re

MACHINE_TYPES = ['host', 'vm', 'physical', 'container', 'cloud', 'virtualization']
TYPE_LABELS = {
    'host': '主机', 'vm': '虚拟机', 'physical': '物理机',
    'container': '容器', 'cloud': '云主机', 'virtualization': '虚拟化'
}

def build_type_options():
    lines = ['                <option value="">全部类型</option>']
    for t in MACHINE_TYPES:
        lines.append('                <option value="' + t + '">' + TYPE_LABELS[t] + '</option>')
    return '\n'.join(lines)

TYPE_OPTIONS_BLOCK = build_type_options()

# ============================================================
# 1. TaskSchedules.tsx
# ============================================================
with open(r'I:\APP\dreamops\frontend\src\pages\automation\TaskSchedules.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1a. hostFilter state: add 'type' field
old_state = "const [hostFilter, setHostFilter] = useState({ environment: '', businessLine: '', keyword: '' });"
new_state = "const [hostFilter, setHostFilter] = useState({ type: '', environment: '', businessLine: '', keyword: '' });"
assert old_state in content, 'TaskSchedules: hostFilter state not found'
content = content.replace(old_state, new_state)

# 1b. loadHosts: use hostFilter.type instead of hardcoded 'host'
old_load = """const items = await getConfigItems({
      type: 'host',
      environment: (hostFilter.environment || undefined) as any,
      keyword: hostFilter.keyword || undefined,
      businessLine: hostFilter.businessLine || undefined,
    });"""
new_load = """const items = await getConfigItems({
      type: (hostFilter.type || undefined) as any,
      environment: (hostFilter.environment || undefined) as any,
      keyword: hostFilter.keyword || undefined,
      businessLine: hostFilter.businessLine || undefined,
    });"""
assert old_load in content, 'TaskSchedules: loadHosts not found'
content = content.replace(old_load, new_load)

# 1c. Add type dropdown BEFORE environment dropdown
# Find the pattern: flex gap-2 ... value={hostFilter.environment}
old_ui = '            <div className="flex gap-2 mb-2 flex-wrap">\n              <select className="flex-1 border rounded px-2 py-1 text-sm" value={hostFilter.environment}'
assert old_ui in content, 'TaskSchedules: UI filter bar not found'

type_select = (
    '            <div className="flex gap-2 mb-2 flex-wrap">\n'
    '              <select className="flex-1 border rounded px-2 py-1 text-sm" value={hostFilter.type}\n'
    '                onChange={e => { const v = e.target.value; setHostFilter(p => ({...p, type: v})); loadHosts(); }}>\n'
    + TYPE_OPTIONS_BLOCK + '\n'
    '              </select>\n'
    '              <select className="flex-1 border rounded px-2 py-1 text-sm" value={hostFilter.environment}'
)
content = content.replace(old_ui, type_select)

with open(r'I:\APP\dreamops\frontend\src\pages\automation\TaskSchedules.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('1. TaskSchedules.tsx OK')

# ============================================================
# 2. ScriptLibrary.tsx
# ============================================================
with open(r'I:\APP\dreamops\frontend\src\pages\automation\ScriptLibrary.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 2a. loadHostData: use hostFilters.type
old_sl = """      const configItems = await getConfigItems({
        type: 'host',
        environment: (hostFilters.environment || undefined) as any,
        keyword: hostFilters.keyword || undefined,
        businessLine: hostFilters.businessLine || undefined,
      });"""
new_sl = """      const configItems = await getConfigItems({
        type: (hostFilters.type || undefined) as any,
        environment: (hostFilters.environment || undefined) as any,
        keyword: hostFilters.keyword || undefined,
        businessLine: hostFilters.businessLine || undefined,
      });"""
assert old_sl in content, 'ScriptLibrary: loadHostData not found'
content = content.replace(old_sl, new_sl)

# 2b. Add 'type' to hostFilters state
old_sf = "const [hostFilters, setHostFilters] = useState({ environment: '', businessLine: '', keyword: '' });"
new_sf = "const [hostFilters, setHostFilters] = useState({ type: '', environment: '', businessLine: '', keyword: '' });"
assert old_sf in content, 'ScriptLibrary: hostFilters state not found'
content = content.replace(old_sf, new_sf)

# 2c. Add type dropdown in run modal - find existing filter bar
# Look for the filter bar in ScriptLibrary
idx = content.find('hostFilters.environment')
if idx > 0:
    # Find the select for environment
    env_select_start = content.rfind('<select', 0, idx)
    if env_select_start > 0:
        # Insert type dropdown before environment dropdown
        # Find the start of the flex container
        flex_start = content.rfind('className="flex', env_select_start - 50, env_select_start)
        if flex_start < 0:
            flex_start = env_select_start - 30
            while flex_start > 0 and content[flex_start] != '\n':
                flex_start -= 1
            flex_start += 1

        # Build type dropdown
        type_dropdown = (
            '              <select className="border rounded px-2 py-1 text-sm" value={hostFilters.type}\n'
            '                onChange={e => handleHostFilterChange("type", e.target.value)}>\n'
            + TYPE_OPTIONS_BLOCK + '\n'
            '              </select>\n'
        )
        # Insert after the flex div opening
        div_end = content.find('>', flex_start) + 1
        content = content[:div_end] + '\n' + type_dropdown + content[div_end:]
        print('2c. ScriptLibrary: type dropdown added')
    else:
        print('2c. ScriptLibrary: could not find env select')
else:
    print('2c. ScriptLibrary: hostFilters.environment not found')

with open(r'I:\APP\dreamops\frontend\src\pages\automation\ScriptLibrary.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('2. ScriptLibrary.tsx OK')

# ============================================================
# 3. JobManagement.tsx
# ============================================================
with open(r'I:\APP\dreamops\frontend\src\pages\automation\JobManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_jm = "const configItems = await getConfigItems({ type: 'host' });"
new_jm = "const configItems = await getConfigItems({});"
assert old_jm in content, 'JobManagement: getConfigItems not found'
content = content.replace(old_jm, new_jm)

with open(r'I:\APP\dreamops\frontend\src\pages\automation\JobManagement.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('3. JobManagement.tsx OK')

print('\nAll done.')
