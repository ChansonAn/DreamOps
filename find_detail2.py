import re

with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 找详情模态框 - 应该在编辑模态框之前
# 搜索 detailModalVisible
idx = content.find('visible={detailModalVisible}')
if idx >= 0:
    # 找到这个模态框内显示信息的位置
    # 搜索 selectedItem 的显示
    snippet = content[idx:idx+3000]
    print(snippet[:2000])
