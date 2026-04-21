import re

with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 在详情模态框的 {/* 标签信息 */} 之前添加连接信息
# 找到第一个 {/* 标签信息 */}（详情模态框中的）
edit_idx = content.find('visible={editModalVisible')
first_tags_idx = content.find('{/* 标签信息 */}')

if first_tags_idx < edit_idx and first_tags_idx >= 0:
    # 在这个位置之前插入连接信息区块
    old_section = '''            {/* 标签信息 */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">标签</h4>'''
    
    new_section = '''            {/* 连接信息 */}
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
              <h4 className="font-medium text-gray-900 mb-2">连接信息</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 font-medium">IP 地址：</span>
                  <span className="font-mono font-medium">{selectedItem.ip || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">SSH 端口：</span>
                  <span className="font-mono font-medium">{selectedItem.sshPort || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">SSH 用户名：</span>
                  <span className="font-mono font-medium">{selectedItem.sshUsername || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">SSH 密码：</span>
                  <span className="font-mono font-medium">{selectedItem.sshPassword ? '••••••' : '-'}</span>
                </div>
              </div>
            </div>

            {/* 标签信息 */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">标签</h4>'''
    
    content = content.replace(old_section, new_section)
    
    with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK: Connection info added to detail modal')
else:
    print('ERROR: Tags section not found in detail modal')
