# -*- coding: utf-8 -*-
with open(r'I:\APP\dreamops\frontend\src\pages\automation\ScriptLibrary.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old = "      const configItems = await getConfigItems('host');"
new = "      const configItems = await getConfigItems({\n        type: 'host',\n        environment: hostFilters.environment || undefined,\n        keyword: hostFilters.keyword || undefined,\n        businessLine: hostFilters.businessLine || undefined,\n      });"

if old in content:
    content = content.replace(old, new, 1)
    with open(r'I:\APP\dreamops\frontend\src\pages\automation\ScriptLibrary.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK: ScriptLibrary.tsx updated')
else:
    print('NOT FOUND')