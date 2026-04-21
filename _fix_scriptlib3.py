# -*- coding: utf-8 -*-

MACHINE_TYPES = ['host', 'vm', 'physical', 'container', 'cloud', 'virtualization']
TYPE_LABELS = {
    'host': '主机', 'vm': '虚拟机', 'physical': '物理机',
    'container': '容器', 'cloud': '云主机', 'virtualization': '虚拟化'
}

def build_type_options():
    lines = ['                  <option value="">全部类型</option>']
    for t in MACHINE_TYPES:
        lines.append('                  <option value="' + t + '">' + TYPE_LABELS[t] + '</option>')
    return '\n'.join(lines)

TYPE_OPTIONS_BLOCK = build_type_options()

with open(r'I:\APP\dreamops\frontend\src\pages\automation\ScriptLibrary.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old = """                <select
                  className="w-full border rounded-md p-2"
                  value={hostFilters.environment}
                  onChange={(e) => handleHostFilterChange('environment', e.target.value)}
                >"""

type_select = """                <select
                  className="w-full border rounded-md p-2"
                  value={hostFilters.type}
                  onChange={(e) => handleHostFilterChange('type', e.target.value)}
                >
""" + TYPE_OPTIONS_BLOCK + """
                </select>
                <select
                  className="w-full border rounded-md p-2"
                  value={hostFilters.environment}
                  onChange={(e) => handleHostFilterChange('environment', e.target.value)}
                >"""

assert old in content, 'ScriptLibrary: env select not found'
content = content.replace(old, type_select, 1)

with open(r'I:\APP\dreamops\frontend\src\pages\automation\ScriptLibrary.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('OK: type dropdown added to ScriptLibrary.tsx')
