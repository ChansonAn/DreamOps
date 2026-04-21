with open(r'I:\APP\dreamops\frontend\src\pages\automation\ScriptLibrary.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the exact occurrence that needs fixing
old = "setHostFilters({\n      environment: '',\n      businessLine: '',\n      keyword: '',\n    });"

new = "setHostFilters({\n      type: '',\n      environment: '',\n      businessLine: '',\n      keyword: '',\n    });"

if old in content:
    content = content.replace(old, new, 1)  # Only replace first occurrence
    print('Fixed!')
    with open(r'I:\APP\dreamops\frontend\src\pages\automation\ScriptLibrary.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
else:
    print('Pattern not found')
