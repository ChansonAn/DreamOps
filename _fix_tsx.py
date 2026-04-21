# -*- coding: utf-8 -*-
with open(r'I:\APP\dreamops\frontend\src\pages\automation\TaskSchedules.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace(
    "(option?.children as string)?.toLowerCase()",
    "(option?.children as unknown as string)?.toLowerCase()"
)
with open(r'I:\APP\dreamops\frontend\src\pages\automation\TaskSchedules.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('done')