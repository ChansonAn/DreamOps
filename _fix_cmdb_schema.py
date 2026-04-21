# -*- coding: utf-8 -*-
with open(r'I:\APP\dreamops\backend\app\schemas\cmdb.py', 'rb') as f:
    raw = f.read()
if raw.startswith(b'\xef\xbb\xbf'):
    raw = raw[3:]
content = raw.decode('utf-8')

# Fix 1: status in CMDBConfigItemBase: required -> optional with default
content = content.replace(
    'status: str = Field(..., min_length=1, max_length=20)',
    'status: str = Field(default="active", max_length=20)'
)

# Fix 2: environment in CMDBConfigItemBase: required -> optional with default
content = content.replace(
    'environment: str = Field(..., min_length=1, max_length=20)',
    'environment: str = Field(default="dev", max_length=20)'
)

# Fix 3: id in CMDBConfigItemCreate: required -> optional (backend generates if empty)
content = content.replace(
    '    id: str = Field(..., min_length=1, max_length=50)',
    '    id: Optional[str] = Field(default=None, max_length=50)'
)

with open(r'I:\APP\dreamops\backend\app\schemas\cmdb.py', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print('Schema fixed')
print('- status: now optional, default=active')
print('- environment: now optional, default=dev')
print('- id: now optional (None = auto-generate)')
