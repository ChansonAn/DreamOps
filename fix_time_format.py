import re

# 读取文件
with open(r'I:\APP\dreamops\frontend\src\api\cmdb.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 替换所有 updateTime 的处理
# 找到所有 updateTime: item.update_time || 的模式并替换
old_pattern = r"updateTime: item\.update_time \|\| new Date\(\)\.toLocaleString\('zh-CN'\)"
new_code = "updateTime: item.update_time ? new Date(item.update_time).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN')"

content = re.sub(old_pattern, new_code, content)

# 同样处理 createdItem 和 updatedItem 的返回
old_pattern2 = r"updateTime: (createdItem|updatedItem)\.update_time \|\| new Date\(\)\.toLocaleString\('zh-CN'\)"
new_code2 = r"updateTime: \1.update_time ? new Date(\1.update_time).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN')"

content = re.sub(old_pattern2, new_code2, content)

with open(r'I:\APP\dreamops\frontend\src\api\cmdb.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("已修复 updateTime 格式化")
