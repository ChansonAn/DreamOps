import re

with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 找详情模态框中显示基本信息的位置
# 搜索 "基本信息" 标题，找到第一个（详情模态框中的）
idx = content.find('<h3 className="text-lg font-semibold">基本信息</h3>')
if idx >= 0:
    # 找到这个区块结束的位置（下一个 </div></div> 或 标签信息）
    print(f'Found at {idx}')
    print(content[idx:idx+800])
