import React, { useState, useEffect } from 'react';
import { message, Input, Tag } from 'antd';
import DataTable from '@/components/common/DataTable';
import Modal from '@/components/common/Modal';
import { usersApi, User } from '@/api/users';

const UserManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 模态框状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<User | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<User | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // 表单数据
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    bio: '',
  });

  // 加载用户数据
  useEffect(() => {
    loadUsers();
  }, [pagination.current, pagination.pageSize]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.list(pagination.current, pagination.pageSize);
      setUsers(response.items);
      setPagination(prev => ({ ...prev, total: response.total }));
    } catch (error) {
      message.error('获取用户列表失败');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // 过滤用户数据
  const filteredUsers = users.filter(user => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
      user.username.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword) ||
      (user.bio && user.bio.toLowerCase().includes(keyword))
    );
  });

  // 分页变更处理
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, current: page }));
  };

  // 查看详情
  const handleViewDetail = (item: User) => {
    setSelectedItem(item);
    setDetailModalVisible(true);
  };

  // 编辑用户
  const handleEditItem = (item: User) => {
    setEditingItem(item);
    setEditModalVisible(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      await usersApi.update(editingItem.id, {
        username: editingItem.username,
        email: editingItem.email,
        is_active: editingItem.is_active,
        is_admin: editingItem.is_admin,
      });
      message.success('用户更新成功');
      setEditModalVisible(false);
      loadUsers();
    } catch (error) {
      message.error('更新用户失败');
      console.error('Error updating user:', error);
    }
  };

  // 删除用户
  const handleDeleteItem = async (item: User) => {
    if (!window.confirm(`确定要删除用户"${item.username}"吗？`)) return;
    try {
      await usersApi.delete(item.id);
      message.success('用户删除成功');
      loadUsers();
    } catch (error) {
      message.error('删除用户失败');
      console.error('Error deleting user:', error);
    }
  };

  // 新建用户
  const handleCreateItem = () => {
    setCreateModalVisible(true);
  };

  // 保存新建
  const handleSaveCreate = async () => {
    try {
      await usersApi.create({
        username: createForm.username,
        email: createForm.email,
        password: createForm.password,
        bio: createForm.bio,
      });
      message.success('用户创建成功');
      setCreateModalVisible(false);
      setCreateForm({ username: '', email: '', password: '', bio: '' });
      loadUsers();
    } catch (error) {
      message.error('创建用户失败');
      console.error('Error creating user:', error);
    }
  };

  // 用户表格列配置
  const userColumns = [
    {
      title: 'ID',
      dataIndex: 'id' as const,
      width: 60,
    },
    {
      title: '用户名',
      dataIndex: 'username' as const,
    },
    {
      title: '邮箱',
      dataIndex: 'email' as const,
    },
    {
      title: '角色',
      dataIndex: 'is_admin' as const,
      render: (isAdmin: boolean) => (
        <Tag color={isAdmin ? 'purple' : 'default'} className="text-xs">
          {isAdmin ? '管理员' : '普通用户'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_active' as const,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'} className="text-xs">
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at' as const,
      render: (time: string) => time ? new Date(time).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: User) => (
        <div className="flex space-x-1 flex-wrap">
          <button 
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs"
            onClick={() => handleViewDetail(record)}
          >
            查看
          </button>
          <button 
            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1 rounded text-xs"
            onClick={() => handleEditItem(record)}
          >
            编辑
          </button>
          <button 
            className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-xs"
            onClick={() => handleDeleteItem(record)}
          >
            删除
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
        <p className="mt-1 text-sm text-gray-500">管理系统用户，包括管理员和普通用户。</p>
      </div>

      {/* 操作栏 */}
      <div className="bg-gray-50 p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex space-x-2">
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
              onClick={handleCreateItem}
            >
              <i className="fa fa-plus mr-2"></i>
              新建用户
            </button>
            <button className="px-4 py-2 border rounded-md hover:bg-gray-100 flex items-center" onClick={loadUsers}>
              <i className="fa fa-refresh mr-2"></i>刷新
            </button>
          </div>
          <div className="flex gap-2">
            <Input.Search placeholder="搜索用户名/邮箱/简介" style={{ width: 220 }}
              onSearch={v => setSearchKeyword(v)} />
          </div>
        </div>
      </div>

      <DataTable
        loading={loading}
        columns={userColumns as any}
        dataSource={filteredUsers}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: handlePageChange,
        }}
      />

      {/* 详情模态框 */}
      <Modal
        title="用户详情"
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <button 
            key="close"
            className="px-4 py-2 border rounded-md hover:bg-gray-100"
            onClick={() => setDetailModalVisible(false)}
          >
            关闭
          </button>
        ]}
      >
        {selectedItem && (
          <div className="space-y-3">
            <div><span className="text-gray-500">ID：</span><span className="font-medium">{selectedItem.id}</span></div>
            <div><span className="text-gray-500">用户名：</span><span className="font-medium">{selectedItem.username}</span></div>
            <div><span className="text-gray-500">邮箱：</span><span>{selectedItem.email}</span></div>
            <div><span className="text-gray-500">角色：</span>
              <Tag color={selectedItem.is_admin ? 'purple' : 'default'} className="text-xs ml-1">
                {selectedItem.is_admin ? '管理员' : '普通用户'}
              </Tag>
            </div>
            <div><span className="text-gray-500">状态：</span>
              <Tag color={selectedItem.is_active ? 'success' : 'error'} className="text-xs ml-1">
                {selectedItem.is_active ? '启用' : '禁用'}
              </Tag>
            </div>
            <div><span className="text-gray-500">个人简介：</span><span>{selectedItem.bio || '-'}</span></div>
            <div><span className="text-gray-500">创建时间：</span><span>{selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleString() : '-'}</span></div>
            <div><span className="text-gray-500">更新时间：</span><span>{selectedItem.updated_at ? new Date(selectedItem.updated_at).toLocaleString() : '-'}</span></div>
          </div>
        )}
      </Modal>

      {/* 编辑模态框 */}
      <Modal
        title="编辑用户"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={[
          <button 
            key="cancel"
            className="px-4 py-2 border rounded-md hover:bg-gray-100 mr-2"
            onClick={() => setEditModalVisible(false)}
          >
            取消
          </button>,
          <button 
            key="confirm"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            onClick={handleSaveEdit}
          >
            确认
          </button>
        ]}
      >
        {editingItem && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border rounded-md" 
                value={editingItem.username}
                onChange={(e) => setEditingItem({ ...editingItem, username: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input 
                type="email" 
                className="w-full px-3 py-2 border rounded-md" 
                value={editingItem.email}
                onChange={(e) => setEditingItem({ ...editingItem, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
              <select 
                className="w-full px-3 py-2 border rounded-md"
                value={editingItem.is_admin ? 'admin' : 'user'}
                onChange={(e) => setEditingItem({ ...editingItem, is_admin: e.target.value === 'admin' })}
              >
                <option value="admin">管理员</option>
                <option value="user">普通用户</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select 
                className="w-full px-3 py-2 border rounded-md"
                value={editingItem.is_active ? 'active' : 'inactive'}
                onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.value === 'active' })}
              >
                <option value="active">启用</option>
                <option value="inactive">禁用</option>
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* 新建模态框 */}
      <Modal
        title="新建用户"
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={[
          <button 
            key="cancel"
            className="px-4 py-2 border rounded-md hover:bg-gray-100 mr-2"
            onClick={() => setCreateModalVisible(false)}
          >
            取消
          </button>,
          <button 
            key="confirm"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            onClick={handleSaveCreate}
          >
            确认
          </button>
        ]}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名 *</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border rounded-md"
              placeholder="请输入用户名"
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 *</label>
            <input 
              type="email" 
              className="w-full px-3 py-2 border rounded-md"
              placeholder="请输入邮箱"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">初始密码 *</label>
            <input 
              type="password" 
              className="w-full px-3 py-2 border rounded-md"
              placeholder="请输入初始密码"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
            <textarea 
              className="w-full px-3 py-2 border rounded-md"
              placeholder="请输入个人简介（可选）"
              value={createForm.bio}
              onChange={(e) => setCreateForm({ ...createForm, bio: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
