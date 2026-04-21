import re

# 读取文件
with open(r'I:\APP\dreamops\frontend\src\api\cmdb.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 在 updateConfigItem 中过滤 undefined 字段
# 找到 updateConfigItem 函数
old_code = '''export const updateConfigItem = async (id: string, item: Partial<ConfigurationItem>): Promise<ConfigurationItem> => {
  try {
    const response = await apiClient.put(`/api/cmdb/config-items/${id}`, {
      ...item,'''

new_code = '''export const updateConfigItem = async (id: string, item: Partial<ConfigurationItem>): Promise<ConfigurationItem> => {
  try {
    // 过滤掉 undefined 字段，避免覆盖已有数据
    const filteredItem = Object.fromEntries(
      Object.entries(item).filter(([_, v]) => v !== undefined)
    );
    const response = await apiClient.put(`/api/cmdb/config-items/${id}`, {
      ...filteredItem,'''

content = content.replace(old_code, new_code)

with open(r'I:\APP\dreamops\frontend\src\api\cmdb.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("已修复 updateConfigItem 过滤 undefined 字段")
