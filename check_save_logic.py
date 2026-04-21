import re

with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 找 handleSaveItem
idx = content.find('const handleSaveItem = async')
if idx >= 0:
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
    
    func_content = content[idx:end]
    
    # 检查新建分支的判断条件
    lines = func_content.split('\n')
    for i, line in enumerate(lines[:20]):
        print(f"{i}: {line}")
