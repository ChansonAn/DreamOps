import re

with open(r'I:\APP\dreamops\backend\app\api\cmdb_yasdb.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 找 create_config_item 端点
idx = content.find('@router.post("/config-items")')
if idx >= 0:
    # 找到这个函数的结束
    brace_count = 0
    end = idx
    in_func = False
    start = content.find('def ', idx)
    if start >= 0:
        for i, c in enumerate(content[start:], start):
            if c == '{':
                brace_count += 1
                in_func = True
            elif c == '}':
                brace_count -= 1
                if in_func and brace_count == 0:
                    end = i + 1
                    break
        print(content[idx:end])
