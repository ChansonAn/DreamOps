import re

with open(r'I:\APP\dreamops\frontend\src\api\cmdb.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find getConfigItems function
idx = content.find('export const getConfigItems')
if idx >= 0:
    # Get the function definition
    snippet = content[idx:idx+1000]
    print(snippet[:800])
