import re

with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 找到基本信息结束、类型特定字段开始的位置
# 搜索 {/* 根据类型显示不同的字段 */}
idx = content.find('{/* 根据类型显示不同的字段 */}')
if idx >= 0:
    print(f'Found at position {idx}')
    print('Context:')
    print(content[idx-200:idx+100])
