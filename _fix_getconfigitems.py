# -*- coding: utf-8 -*-
# Fix AssetManagement.tsx
with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('const items = await getConfigItems(activeType ?? undefined);',
                          'const items = await getConfigItems({ type: activeType ?? undefined });')
with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('AssetManagement.tsx fixed')

# Fix JobManagement.tsx
with open(r'I:\APP\dreamops\frontend\src\pages\automation\JobManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("const configItems = await getConfigItems('host');",
                          "const configItems = await getConfigItems({ type: 'host' });")
with open(r'I:\APP\dreamops\frontend\src\pages\automation\JobManagement.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('JobManagement.tsx fixed')