import re

with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 在 {/* 根据类型显示不同的字段 */} 之前插入通用连接信息区块
old_marker = '''            </div>
          </div>

            {/* 根据类型显示不同的字段 */}'''

new_marker = '''            </div>
          </div>

            {/* 连接信息 - 所有类型通用 */}
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
              <h4 className="text-lg font-semibold mb-3">连接信息</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">IP 地址</label>
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="如: 192.168.1.100"
                      value={editingItem.ip || ''}
                      onChange={(e) => setEditingItem({...editingItem, ip: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">SSH 端口</label>
                    <input
                      type="number"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="默认 22"
                      value={editingItem.sshPort || ''}
                      onChange={(e) => setEditingItem({...editingItem, sshPort: parseInt(e.target.value) || undefined})}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">SSH 用户名</label>
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="SSH 登录用户名"
                      value={editingItem.sshUsername || ''}
                      onChange={(e) => setEditingItem({...editingItem, sshUsername: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">SSH 密码</label>
                    <input
                      type="password"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="SSH 登录密码"
                      value={editingItem.sshPassword || ''}
                      onChange={(e) => setEditingItem({...editingItem, sshPassword: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 根据类型显示不同的字段 */}'''

if old_marker in content:
    content = content.replace(old_marker, new_marker)
    with open(r'I:\APP\dreamops\frontend\src\pages\asset\AssetManagement.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK: Connection info section added')
else:
    print('ERROR: Marker not found')
