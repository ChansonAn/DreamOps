import re

with open(r'I:\APP\dreamops\frontend\src\pages\automation\ScriptLibrary.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace getConfigItems call
pattern = r'getConfigItems\(\{[^}]+\}\)'
matches = re.findall(pattern, content, re.DOTALL)
for m in matches:
    if 'type:' in m:
        print('Found in ScriptLibrary:')
        print(m[:200])
