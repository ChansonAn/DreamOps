import re

with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 找 handleCreateItem 函数
idx = content.find('const handleCreateItem = () => {')
if idx >= 0:
    # 打印这个函数
    snippet = content[idx:idx+1000]
    print(snippet[:800])
