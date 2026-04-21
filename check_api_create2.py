import re

with open(r'I:\APP\dreamops\backend\app\api\cmdb_yasdb.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 找 create_config_item 相关代码
lines = content.split('\n')
in_create = False
indent_level = 0
result = []

for i, line in enumerate(lines):
    if '@router.post("/config-items")' in line or 'def create_config_item' in line:
        in_create = True
        indent_level = len(line) - len(line.lstrip())
    if in_create:
        result.append(line)
        if line.strip().startswith('return') and len(line) - len(line.lstrip()) <= indent_level + 4:
            break

print('\n'.join(result[:80]))
