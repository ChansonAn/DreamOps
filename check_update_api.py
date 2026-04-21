import re

with open(r'I:\APP\dreamops\frontend\src\api\cmdb.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 找 updateConfigItem 函数
idx = content.find('export const updateConfigItem')
if idx >= 0:
    # 找函数结束
    brace_count = 0
    end = idx
    in_func = False
    for i, c in enumerate(content[idx:], idx):
        if c == '{':
            brace_count += 1
            in_func = True
        elif c == '}':
            brace_count -= 1
            if in_func and brace_count == 0:
                end = i + 1
                break
    print(content[idx:end])
