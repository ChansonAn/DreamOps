import re

with open(r'I:\APP\dreamops\frontend\src\pages\automation\TaskSchedules.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

matches = re.findall(r'placeholder="([^"]+)"', content)
for m in matches:
    print(repr(m))
