# -*- coding: utf-8 -*-

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
# 2. ScriptLibrary.tsx - fix hostFilters state (multiline)
# ============================================================
with open(r'I:\APP\dreamops\frontend\src\pages\automation\ScriptLibrary.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 2a. hostFilters state: add 'type' field
old_state = """const [hostFilters, setHostFilters] = useState({
    environment: '',
    businessLine: '',
    keyword: '',
  });"""
new_state = """const [hostFilters, setHostFilters] = useState({
    type: '',
    environment: '',
    businessLine: '',
    keyword: '',
  });"""
assert old_state in content, 'ScriptLibrary: hostFilters multiline state not found'
content = content.replace(old_state, new_state)

# 2b. loadHostData: use hostFilters.type
old_load = """      const configItems = await getConfigItems({
        type: 'host',
        environment: (hostFilters.environment || undefined) as any,
        keyword: hostFilters.keyword || undefined,
        businessLine: hostFilters.businessLine || undefined,
      });"""
new_load = """      const configItems = await getConfigItems({
        type: (hostFilters.type || undefined) as any,
        environment: (hostFilters.environment || undefined) as any,
        keyword: hostFilters.keyword || undefined,
        businessLine: hostFilters.businessLine || undefined,
      });"""
assert old_load in content, 'ScriptLibrary: loadHostData not found'
content = content.replace(old_load, new_load)

# 2c. Add type dropdown in filter bar
# Find the host filter bar
idx = content.find('handleHostFilterChange')
print(f'handleHostFilterChange found at: {idx}')

# Find existing select for environment
env_idx = content.find('hostFilters.environment')
print(f'hostFilters.environment found at: {env_idx}')

# Insert type dropdown before the first select in the filter section
# Look for the pattern: onChange={e => handleHostFilterChange("environment"
env_handler = 'onChange={e => handleHostFilterChange("environment"'
if env_handler in content:
    # Find the <select before it
    select_start = content.rfind('<select', 0, env_idx)
    # Insert type dropdown before this select
    type_dropdown = (
        '              <select className="border rounded px-2 py-1 text-sm" value={hostFilters.type}\n'
        '                onChange={e => handleHostFilterChange("type", e.target.value)}>\n'
        + TYPE_OPTIONS_BLOCK + '\n'
        '              </select>\n'
        '              '
    )
    content = content[:select_start] + type_dropdown + content[select_start:]
    print('2c. type dropdown inserted')
else:
    print('2c. environment handler not found, skipping dropdown insert')

with open(r'I:\APP\dreamops\frontend\src\pages\automation\ScriptLibrary.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('2. ScriptLibrary.tsx OK')
