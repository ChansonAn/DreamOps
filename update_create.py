import re

with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 更新 handleCreateItem 初始化
old_create = '''const handleCreateItem = () => {
    setEditingItem({
      id: `new-${Date.now()}`,
      name: '',
      type: activeType || 'network',
      status: 'inactive',
      environment: 'dev',
      businessLine: '',
      owner: '',
      createTime: new Date().toLocaleString('zh-CN'),
      updateTime: new Date().toLocaleString('zh-CN'),
      tags: [],
      // 初始化为空对象
      tagTypes: {}
    } as ExtendedConfigurationItem);'''

new_create = '''const handleCreateItem = () => {
    setEditingItem({
      id: `new-${Date.now()}`,
      name: '',
      type: activeType || 'network',
      status: 'inactive',
      environment: 'dev',
      businessLine: '',
      owner: '',
      createTime: new Date().toLocaleString('zh-CN'),
      updateTime: new Date().toLocaleString('zh-CN'),
      tags: [],
      // 连接信息
      ip: '',
      sshPort: undefined,
      sshUsername: '',
      sshPassword: '',
      // 初始化为空对象
      tagTypes: {}
    } as ExtendedConfigurationItem);'''

if old_create in content:
    content = content.replace(old_create, new_create)
    with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK: handleCreateItem updated with SSH fields')
else:
    print('ERROR: handleCreateItem not found exactly')
    # 尝试模糊匹配
    idx = content.find('const handleCreateItem')
    if idx >= 0:
        print('Found at', idx)
        print(content[idx:idx+500])
