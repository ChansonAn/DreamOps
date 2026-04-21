import re

with open(r'I:\APP\dreamops\frontend\src\pages\automation\TaskSchedules.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find getConfigItems call with full context
pattern = r'getConfigItems\(\{[^}]+\}\)'
matches = re.findall(pattern, content, re.DOTALL)
for i, m in enumerate(matches):
    print(f'--- Match {i+1} ---')
    print(m[:500])
    print()
