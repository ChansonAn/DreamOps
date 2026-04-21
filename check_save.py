import re

with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 检查 handleSaveItem 函数
idx = content.find('const handleSaveItem = async (item:')
if idx >= 0:
    # 打印整个函数
    snippet = content[idx:idx+3000]
    print(snippet[:2500])
