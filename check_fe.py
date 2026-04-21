import re

with open(r'I:\APP\dreamops\frontend\src\pages\automation\TaskSchedules.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find getConfigItems call
matches = re.findall(r'getConfigItems\([^)]+\)', content)
for m in matches:
    print('TaskSchedules:', m[:100])
