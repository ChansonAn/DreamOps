import re

with open(r'IAPP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 找编辑表单区域 - 搜索 editingItem 相关的表单
# 找 Modal 中 Form.Item 包含 ip 的
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'ip' in line.lower() and 'form' in lines[max(0,i-3):i+1]:
        print(f'{i+1}: {line[:100]}')
