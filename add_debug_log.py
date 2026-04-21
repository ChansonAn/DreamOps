import re

# 读取文件
with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 在 handleSaveItem 开头添加调试日志
old_code = '''const handleSaveItem = async (item: ExtendedConfigurationItem) => {
    // 表单验证
    if (!item.name) {'''

new_code = '''const handleSaveItem = async (item: ExtendedConfigurationItem) => {
    // 调试：打印传入的 item
    console.log('=== handleSaveItem 调用 ===');
    console.log('item.id:', item.id);
    console.log('item.id 类型:', typeof item.id);
    console.log('是否走新建分支:', !item.id || String(item.id).startsWith("new-"));
    console.log('完整 item:', JSON.stringify(item, null, 2));
    
    // 表单验证
    if (!item.name) {'''

content = content.replace(old_code, new_code)

with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("已添加调试日志")
