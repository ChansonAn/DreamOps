with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 找 Modal 或 Form 标签
import re
matches = list(re.finditer(r'<Modal|<Form', content))
print(f'Found {len(matches)} Modal/Form tags')
for m in matches[:5]:
    idx = m.start()
    print(f'Position {idx}: {content[idx:idx+50]}')
