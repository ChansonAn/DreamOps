import re

with open(r'I:\APP\dreamops\frontend\src\pages\automation\TaskSchedules.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find getConfigItems call - get more context
idx = content.find('getConfigItems')
if idx >= 0:
    # Get 500 chars around it
    snippet = content[max(0, idx-50):idx+300]
    print(snippet)
