import re

with open(r'I:\APP\dreamops\frontend\src\pages\automation\ScriptLibrary.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace getConfigItems call
old_call = '''getConfigItems({
        type: (hostFilters.type || undefined) as any,
        environment: (hostFilters.environment || undefined) as any,
        keyword: hostFilters.keyword || undefined,'''

new_call = '''getConfigItems({
        types: hostFilters.type ? [hostFilters.type as any] : ['host', 'vm', 'physical', 'container'],
        environment: (hostFilters.environment || undefined) as any,
        keyword: hostFilters.keyword || undefined,'''

content = content.replace(old_call, new_call)

with open(r'I:\APP\dreamops\frontend\src\pages\automation\ScriptLibrary.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('ScriptLibrary.tsx updated')
