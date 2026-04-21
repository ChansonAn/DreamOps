import re

with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 找编辑表单区域 - 搜索 editingItem 相关的表单
# 找 Modal 中 Form.Item 包含 ip 的
lines = content.split('\n')
for i, line in enumerate(lines):
    lower = line.lower()
    if 'ip' in lower or 'ssh' in lower or '端口' in lower:
        # 检查是否在表单区域
        context = '\n'.join(lines[max(0,i-5):i+5])
        if 'Form.Item' in context or 'Input' in context:
            print(f'{i+1}: {line.strip()[:80]}')
