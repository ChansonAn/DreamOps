import re

# 读取文件
with open(r'I:\APP\dreamops\frontend\src\api\cmdb.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 在 createConfigItem 中过滤 undefined 字段
old_code = '''export const createConfigItem = async (item: Omit<ConfigurationItem, 'id' | 'createTime' | 'updateTime'>): Promise<ConfigurationItem> => {
  try {
    const response = await apiClient.post('/api/cmdb/config-items', {
      ...item,'''

new_code = '''export const createConfigItem = async (item: Omit<ConfigurationItem, 'id' | 'createTime' | 'updateTime'>): Promise<ConfigurationItem> => {
  try {
    // 过滤掉 undefined 字段
    const filteredItem = Object.fromEntries(
      Object.entries(item).filter(([_, v]) => v !== undefined)
    );
    const response = await apiClient.post('/api/cmdb/config-items', {
      ...filteredItem,'''

content = content.replace(old_code, new_code)

with open(r'I:\APP\dreamops\frontend\src\api\cmdb.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("已修复 createConfigItem 过滤 undefined 字段")
