import re

with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 找编辑表单中的 IP/SSH 字段
# 搜索 label 包含 IP、端口、SSH 的 FormItem
pattern = r'<Form\.Item[^>]*label=["\'][^"\']*(?:IP|端口|SSH|ssh)[^"\']*["\'][^>]*>.*?</Form\.Item>'
matches = re.findall(pattern, content, re.DOTALL)
print(f'Found {len(matches)} SSH/IP form items')
for i, m in enumerate(matches):
    print(f'\n--- Item {i+1} ---')
    print(m[:300])
