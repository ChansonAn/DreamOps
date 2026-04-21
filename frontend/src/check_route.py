import re

with open(r'I:\APP\dreamops\frontend\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find Dashboard references
for i, line in enumerate(content.split('\n')):
    if 'Dashboard' in line or 'dashboard' in line:
        print(f'{i+1}: {repr(line)}')
