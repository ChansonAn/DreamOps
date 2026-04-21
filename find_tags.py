import re

with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 找 {/* 标签信息 */} 在详情模态框中的位置
# 注意有两个 {/* 标签信息 */}，一个是详情模态框的，一个是编辑表单的
# 我们需要详情模态框的那个（第一个）

idx = content.find('{/* 标签信息 */}')
if idx >= 0:
    # 确认是在详情模态框中（在 detailModalVisible 之后，editModalVisible 之前）
    edit_idx = content.find('visible={editModalVisible')
    if idx < edit_idx:
        print(f'Found detail modal tags at {idx}')
        print(content[idx-200:idx+100])
