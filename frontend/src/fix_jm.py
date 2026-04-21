with open(r'I:\APP\dreamops\frontend\src\pages\automation\JobManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "getConfigItems('host')",
    "getConfigItems()"
)

content = content.replace(
    ".filter((h: ConfigurationItem) => h.type === 'host')",
    ".filter((h: ConfigurationItem) => ['host','vm','physical','virtualization','cloud','container'].includes(h.type))"
)

with open(r'I:\APP\dreamops\frontend\src\pages\automation\JobManagement.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed JobManagement.tsx')
