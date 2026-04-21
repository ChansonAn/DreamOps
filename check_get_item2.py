import re

with open(r'I:\APP\dreamops\backend\app\crud\cmdb_yasdb.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 找 get_config_item 函数（单数）
idx = content.find('def get_config_item(')
if idx >= 0:
    end = content.find('\ndef ', idx + 10)
    if end == -1:
        end = len(content)
    print(content[idx:end])
else:
    print("未找到 get_config_item 函数")
