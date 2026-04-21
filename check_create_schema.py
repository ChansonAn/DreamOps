import re

with open(r'I:\APP\dreamops\backend\app\schemas\cmdb.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 找 CMDBConfigItemCreate
idx = content.find('class CMDBConfigItemCreate')
if idx >= 0:
    end = content.find('class ', idx + 10)
    if end == -1:
        end = len(content)
    print(content[idx:end])
