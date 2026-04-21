import re

with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 找编辑模态框中的表单字段
# 找 name 或 type 字段的位置
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'name="name"' in line and 'Form.Item' in lines[max(0,i-3):i+1]:
        print(f'{i+1}: {line.strip()[:80]}')
        # 打印前后几行
        for j in range(max(0,i-2), min(len(lines), i+10)):
            print(f'{j+1}: {lines[j][:80]}')
        break
