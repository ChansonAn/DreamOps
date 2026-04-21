import re

with open(r'I:\APP\dreamops\frontend\src\pages\automation\TaskSchedules.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace getConfigItems call to use types parameter
old_call = '''getConfigItems({
      type: (hostFilter.type || undefined) as any,
      environment: (hostFilter.environment || undefined) as any,
      keyword: hostFilter.keyword || undefined,
      businessLine: hostFilter.businessLine || undefined,
    })'''

new_call = '''getConfigItems({
      types: hostFilter.type ? [hostFilter.type as any] : ['host', 'vm', 'physical', 'container'],
      environment: (hostFilter.environment || undefined) as any,
      keyword: hostFilter.keyword || undefined,
      businessLine: hostFilter.businessLine || undefined,
    })'''

content = content.replace(old_call, new_call)

with open(r'I:\APP\dreamops\frontend\src\pages\automation\TaskSchedules.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('TaskSchedules.tsx updated')
