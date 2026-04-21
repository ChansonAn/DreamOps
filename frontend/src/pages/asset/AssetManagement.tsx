import React, { useState, useEffect } from 'react';
import DataTable, { Column } from '@/components/common/DataTable';
import Modal from '@/components/common/Modal';
import TopologyChart from '@/components/charts/TopologyChart';
import { getConfigItems, createConfigItem, updateConfigItem, deleteConfigItem, getTags, getRelationships, createRelationship, deleteRelationship, ConfigurationItem, ConfigurationItemType } from '@/api/cmdb';

// 中间件分类类型
type MiddlewareCategory = 'database' | 'message-queue' | 'app-server';

// 中间件类型
type MiddlewareType = 
  // 数据库
  | 'Oracle' | 'MySQL' | 'MongoDB' | 'Redis' | 'OceanBase' | 'TiDB' | 'TDSQL'
  // 消息队列
  | 'RabbitMQ' | 'Kafka' | 'RocketMQ' | 'ActiveMQ'
  // 应用服务器
  | 'WebSphere' | 'WebLogic' | 'JBoss' | 'Tomcat' | 'Jetty';

// 定义标签接口
interface Tag {
  id: string;
  name: string;
  color: string;
}

// 定义关系接口
interface Relationship {
  id: number;
  source: string;
  target: string;
  type: string;
}

// 扩展ConfigurationItem类型
interface ExtendedConfigurationItem extends ConfigurationItem {
  // 标签类型映射
  tagTypes?: Record<number, string>;
  // 中间件特有属性（覆盖父类型为string以兼容API返回值）
  middlewareType?: string;
  middlewareCategory?: string;
}

const AssetManagement: React.FC = () => {
  // 加载状态
  const [loading, setLoading] = useState(true);
  // 配置项列表
  const [configItems, setConfigItems] = useState<ExtendedConfigurationItem[]>([]);
  // 当前选中的配置项类型（null 表示显示所有类型）
  const [activeType, setActiveType] = useState<ConfigurationItemType | null>(null);
  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  // 详情模态框状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExtendedConfigurationItem | null>(null);
  // 编辑模态框状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ExtendedConfigurationItem | null>(null);
  // 新建模态框状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  // 关系拓扑模态框状态
  const [relationshipModalVisible, setRelationshipModalVisible] = useState(false);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  // 标签列表
  const [tags, setTags] = useState<Tag[]>([]);
  // 搜索关键词
  const [searchKeyword, setSearchKeyword] = useState('');
  // 搜索字段选择
  const [searchField, setSearchField] = useState('all');
  // 搜索匹配模式：exact（精确匹配）或 fuzzy（模糊匹配）
  const [searchMode, setSearchMode] = useState<'fuzzy' | 'exact'>('fuzzy');
  // 筛选条件
  const [filters, setFilters] = useState({
    environment: '',
    businessLine: '',
    status: '',
    owner: '',
    tag: '',
  });
  
  // 关系管理相关状态
  const [currentRelationships, setCurrentRelationships] = useState<Relationship[]>([]);
  const [relationshipTarget, setRelationshipTarget] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState<string>('');
  // 关系配置弹窗内的搜索过滤
  const [relModalSearch, setRelModalSearch] = useState('');
  const [relModalTypeFilter, setRelModalTypeFilter] = useState('');

  // 关系配置弹窗内可选资产列表（已排除自身）
  const selectableTargets = configItems.filter(item => item.id !== editingItem?.id);

  // 关系配置弹窗过滤后的资产列表
  const filteredSelectableTargets = selectableTargets.filter(item => {
    if (relModalSearch && !item.name.toLowerCase().includes(relModalSearch.toLowerCase())) return false;
    if (relModalTypeFilter && item.type !== relModalTypeFilter) return false;
    return true;
  });

  // 从API获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 获取配置项列表
        const items = await getConfigItems({ type: activeType ?? undefined });
        const configItems = (items || []).map(item => ({
          ...item,
          tagTypes: item.tagTypes || {}
        })) as ExtendedConfigurationItem[];
        setConfigItems(configItems);
        // 更新分页总数，使用函数形式确保获取最新状态
        setPagination(prev => ({
          ...prev,
          current: 1,
          total: configItems.length,
        }));

        // 获取标签列表
        const tagList = await getTags();
        setTags(tagList || []);

        // 获取关系列表
        const relationshipsList = await getRelationships();
        setRelationships(relationshipsList || []);
      } catch (error) {
        console.error('获取CMDB数据失败:', error);
        setConfigItems([]);
        setTags([]);
        setRelationships([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeType]);

  // 分页变更处理
  const handlePageChange = (page: number, pageSize?: number) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      ...(pageSize !== undefined ? { pageSize } : {})
    }));
  };

  // 切换配置项类型
  const handleTypeChange = (type: ConfigurationItemType | null) => {
    setActiveType(type);
    // 只重置当前页码，不更新总数，总数会在数据加载完成后更新
    setPagination({
      ...pagination,
      current: 1
    });
  };

  // 查看配置项详情
  const handleViewDetail = (item: ExtendedConfigurationItem) => {
    setSelectedItem(item);
    setDetailModalVisible(true);
  };

  // 编辑配置项
  const handleEditItem = (item: ExtendedConfigurationItem) => {
    // 确保tagTypes属性在编辑时被正确复制，如果不存在则初始化为空对象
    setEditingItem({ 
      ...item, 
      tagTypes: item.tagTypes || {} 
    });
    
    // 加载当前项的关系
    const itemRelationships = relationships.filter(rel => rel.source === item.id);
    setCurrentRelationships(itemRelationships);
    
    // 重置关系表单
    setRelationshipTarget('');
    setRelationshipType('');
    
    setEditModalVisible(true);
  };

  // 删除配置项
  const handleDeleteItem = async (item: ExtendedConfigurationItem) => {
    if (window.confirm(`确定要删除配置项"${item.name}"吗？`)) {
      try {
        await deleteConfigItem(item.id);
        // 更新本地列表
        setConfigItems(prevItems => prevItems.filter(prevItem => prevItem.id !== item.id));
        setPagination(prev => ({
          ...prev,
          total: prev.total - 1
        }));
      } catch (error) {
        console.error('删除配置项失败:', error);
        alert('删除配置项失败，请重试');
      }
    }
  };

  // 新建配置项
  const handleCreateItem = () => {
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
    } as ExtendedConfigurationItem);
    
    // 重置关系状态
    setCurrentRelationships([]);
    setRelationshipTarget('');
    setRelationshipType('');
    
    setCreateModalVisible(true);
  };

  // 查看关系拓扑
  const handleViewRelationships = (item: ExtendedConfigurationItem) => {
    setSelectedItem(item);
    setRelationshipModalVisible(true);
  };
  
  // 获取搜索字段的显示标签
  const getSearchFieldLabel = (field: string): string => {
    const fieldLabels: Record<string, string> = {
      'all': '所有字段',
      'name': '名称',
      'ip': 'IP地址',
      'hostname': '主机名',
      'businessLine': '业务线',
      'owner': '负责人',
      'sshUsername': 'SSH用户名',
      'sshPort': 'SSH端口',
      'tags': '标签',
      'os': '操作系统',
      'deviceType': '设备类型',
      'location': '位置',
      'version': '版本'
    };
    return fieldLabels[field] || field;
  };
  
  // 检查文本是否匹配搜索关键词
  const checkMatch = (text: string, keyword: string): boolean => {
    if (!text) return false;
    
    if (searchMode === 'exact') {
      // 精确匹配：完全相等（忽略大小写）
      return text.toLowerCase() === keyword.toLowerCase();
    } else {
      // 模糊匹配：包含关键词（默认）
      return text.toLowerCase().includes(keyword.toLowerCase());
    }
  };
  
  // 添加关系
  const handleAddRelationship = () => {
    if (!relationshipTarget || !relationshipType || !editingItem) return;
    
    const newRelationship: Relationship = {
      id: 0,
      source: editingItem.id,
      target: relationshipTarget,
      type: relationshipType as 'uses' | 'depends' | 'contains' | 'connects' | 'hosts' | 'provides'
    };
    
    setCurrentRelationships([...currentRelationships, newRelationship]);
    
    // 重置表单
    setRelationshipTarget('');
    setRelationshipType('');
  };
  
  // 删除关系
  const handleRemoveRelationship = (index: number) => {
    const newRelationships = [...currentRelationships];
    newRelationships.splice(index, 1);
    setCurrentRelationships(newRelationships);
  };

  // 保存编辑的配置项
  const handleSaveItem = async (item: ExtendedConfigurationItem) => {
    // 调试：打印传入的 item
    console.log('=== handleSaveItem 调用 ===');
    console.log('item.id:', item.id);
    console.log('item.id 类型:', typeof item.id);
    console.log('是否走新建分支:', !item.id || String(item.id).startsWith("new-"));
    console.log('完整 item:', JSON.stringify(item, null, 2));
    
    // 表单验证
    if (!item.name) {
      alert('请填写配置项名称');
      return;
    }
    
    // 根据类型验证特有字段

    try {
        if (!item.id || String(item.id).startsWith("new-")) {
          // 新建配置项
        const newItem = await createConfigItem(item);
        // 添加到本地列表，确保类型正确
        const newItemExtended: ExtendedConfigurationItem = {
          ...newItem,
          // 确保SSH字段被正确包含
          sshPort: newItem.sshPort,
          sshUsername: newItem.sshUsername,
          sshPassword: newItem.sshPassword,
          sshPrivateKey: newItem.sshPrivateKey,
          tagTypes: (newItem as any).tagTypes || {}
        };
        const newItems = [...configItems, newItemExtended];
        setConfigItems(newItems);
        setCreateModalVisible(false);
          
          // 保存关系
          if (currentRelationships.length > 0) {
            for (const rel of currentRelationships) {
              const createdRel = await createRelationship({
                source: newItem.id,
                target: rel.target,
                type: rel.type
              });
              // 更新本地关系列表，使用后端返回的完整关系对象
              setRelationships(prev => [...prev, createdRel]);
            }
          }
          
          // 更新分页总数
          setPagination(prev => ({
            ...prev,
            total: newItems.filter(i => !activeType || i.type === activeType).length,
          }));
        } else {
          // 编辑配置项
          const updatedItem = await updateConfigItem(item.id, item);
          // 更新本地列表，确保类型正确
          // 注意：后端可能不会返回所有字段，所以需要合并原有的SSH数据
          const originalItem = configItems.find(prevItem => prevItem.id === item.id);
          const updatedItemExtended: ExtendedConfigurationItem = {
            ...updatedItem,
            // 保留原有的SSH数据，如果更新后的项中没有这些字段
            sshPort: updatedItem.sshPort !== undefined ? updatedItem.sshPort : originalItem?.sshPort,
            sshUsername: updatedItem.sshUsername !== undefined ? updatedItem.sshUsername : originalItem?.sshUsername,
            sshPassword: updatedItem.sshPassword !== undefined ? updatedItem.sshPassword : originalItem?.sshPassword,
            sshPrivateKey: updatedItem.sshPrivateKey !== undefined ? updatedItem.sshPrivateKey : originalItem?.sshPrivateKey,
            tagTypes: (updatedItem as any).tagTypes || {}
          };
          const updatedItems = configItems.map(prevItem => 
            prevItem.id === item.id ? updatedItemExtended : prevItem
          );
          setConfigItems(updatedItems);
          setEditModalVisible(false);
          
          // 保存关系：先删除旧关系，再添加新关系
          const oldRelationships = relationships.filter(rel => rel.source === item.id);
          for (const rel of oldRelationships) {
            await deleteRelationship(rel.id);
          }
          // 从本地列表中移除旧关系
          setRelationships(relationships.filter(rel => rel.source !== item.id));
          
          // 更新关系
          for (const rel of currentRelationships) {
            const createdRel = await createRelationship({
              source: item.id,
              target: rel.target,
              type: rel.type
            });
            setRelationships(prev => [...prev, createdRel]);
          }
          
          // 更新分页数据
          setPagination(prev => ({
            ...prev,
            total: updatedItems.filter(i => !activeType || i.type === activeType).length,
          }));
        }
    } catch (error: any) {
      console.error('保存资产失败:', error);
      console.error('错误详情:', error?.response?.data || error?.message);
      const errMsg = error?.response?.data?.detail || error?.message || '未知错误';
      console.error('保存配置项失败:', error);
      alert('保存配置项失败，请重试');
    }
  };

  // 过滤配置项
  const filteredItems = configItems.filter(item => {
    // 按类型过滤（只有当 activeType 不为 null 时才过滤）
    if (activeType && item.type !== activeType) return false;
    
    // 智能搜索：根据选择的字段进行搜索
    if (searchKeyword) {
      let matches = false;
      
      switch (searchField) {
        case 'all':
          // 搜索所有文本字段
          matches = 
            checkMatch(item.name, searchKeyword) ||
            checkMatch(item.businessLine || '', searchKeyword) ||
            checkMatch(item.owner || '', searchKeyword) ||
            checkMatch(item.ip || '', searchKeyword) ||
            checkMatch(item.hostname || '', searchKeyword) ||
            checkMatch(item.sshUsername || '', searchKeyword) ||
            checkMatch(item.sshPort?.toString() || '', searchKeyword) ||
            checkMatch(item.os || '', searchKeyword) ||
            checkMatch(item.deviceType || '', searchKeyword) ||
            checkMatch(item.location || '', searchKeyword) ||
            checkMatch(item.version || '', searchKeyword) ||
            (item.tags || []).some(tag => checkMatch(tag || '', searchKeyword));
          break;
          
        case 'name':
          matches = checkMatch(item.name, searchKeyword);
          break;
          
        case 'ip':
          matches = checkMatch(item.ip || '', searchKeyword);
          break;
          
        case 'hostname':
          matches = checkMatch(item.hostname || '', searchKeyword);
          break;
          
        case 'businessLine':
          matches = checkMatch(item.businessLine || '', searchKeyword);
          break;
          
        case 'owner':
          matches = checkMatch(item.owner || '', searchKeyword);
          break;
          
        case 'sshUsername':
          matches = checkMatch(item.sshUsername || '', searchKeyword);
          break;
          
        case 'sshPort':
          matches = checkMatch(item.sshPort?.toString() || '', searchKeyword);
          break;
          
        case 'tags':
          matches = (item.tags || []).some(tag => checkMatch(tag || '', searchKeyword));
          break;
          
        case 'os':
          matches = checkMatch(item.os || '', searchKeyword);
          break;
          
        case 'deviceType':
          matches = checkMatch(item.deviceType || '', searchKeyword);
          break;
          
        case 'location':
          matches = checkMatch(item.location || '', searchKeyword);
          break;
          
        case 'version':
          matches = checkMatch(item.version || '', searchKeyword);
          break;
          
        default:
          // 默认搜索所有字段
          matches = checkMatch(item.name, searchKeyword) ||
                   checkMatch(item.businessLine || '', searchKeyword) ||
                   checkMatch(item.owner || '', searchKeyword) ||
                   (item.tags || []).some(tag => checkMatch(tag || '', searchKeyword));
      }
      
      if (!matches) return false;
    }
    
    // 按环境过滤
    if (filters.environment && item.environment !== filters.environment) 
      return false;
    
    // 按业务线过滤
    if (filters.businessLine && item.businessLine !== filters.businessLine) 
      return false;
    
    // 按状态过滤
    if (filters.status && item.status !== filters.status)
      return false;

    // 按负责人过滤
    if (filters.owner && item.owner !== filters.owner)
      return false;

    // 按标签过滤
    if (filters.tag && !(item.tags || []).includes(filters.tag))
      return false;

    return true;
  });

  // 分页处理
  const paginatedItems = filteredItems.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  // 获取状态标签样式
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取环境标签样式
  const getEnvironmentClass = (environment: string) => {
    switch (environment) {
      case 'dev':
        return 'bg-blue-100 text-blue-800';
      case 'test':
        return 'bg-purple-100 text-purple-800';
      case 'staging':
        return 'bg-yellow-100 text-yellow-800';
      case 'prod':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 配置项列表的表格列配置
  const columns: Column<ExtendedConfigurationItem>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      width: '200',
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: '100',
      render: (text: string, _record: ExtendedConfigurationItem, _index: number) => {
        const typeMap: Record<string, string> = {
          'network': '网络设备',
          'application': '应用服务',
          'middleware': '中间件',
          'cloud': '云资源',
          'database': '数据库',
          'cabinet': '机柜',
          'physical': '物理机',
          'virtualization': '虚拟化',
          'vm': '虚拟机',
          'container': '容器化'
        };
        return typeMap[text] || text;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: '100',
      render: (text: string, _record: ExtendedConfigurationItem, _index: number) => {
        const statusMap: Record<string, string> = {
          'active': '运行中',
          'inactive': '已停用',
          'maintenance': '维护中'
        };
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(text)}`}>
            {statusMap[text] || text}
          </span>
        );
      },
    },
    {
      title: '环境',
      dataIndex: 'environment',
      width: '100',
      render: (text: string, _record: ExtendedConfigurationItem, _index: number) => {
        const envMap: Record<string, string> = {
          'dev': '开发',
          'test': '测试',
          'staging': '预生产',
          'prod': '生产'
        };
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEnvironmentClass(text)}`}>
            {envMap[text] || text}
          </span>
        );
      },
    },
    {
      title: '业务线',
      dataIndex: 'businessLine',
      width: '150',
    },
    {
      title: '负责人',
      dataIndex: 'owner',
      width: '100',
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: '200',
      render: (text: string) => (
        <span className="whitespace-nowrap">{text}</span>
      )
    },
    {
      title: '标签',
      dataIndex: 'tags',
      width: '150',
      render: (tagList: string[], _record: ExtendedConfigurationItem, _index: number) => {
        return (
          <div className="flex flex-wrap gap-1">
            {tagList.filter(tag => tag).map((tag, index) => {
              const tagInfo = tags.find(t => t.name === tag);
              return (
                <span 
                  key={index} 
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tagInfo?.color || 'bg-gray-100 text-gray-800'}`}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      title: '操作',
      dataIndex: 'id',
      width: '180',
      render: (_: string, record: ExtendedConfigurationItem) => (
        <div className="flex space-x-1 flex-wrap">
          <button 
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs" 
            onClick={() => handleViewDetail(record)}
          >
            查看
          </button>
          <button 
            className="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded text-xs" 
            onClick={() => handleEditItem(record)}
          >
            编辑
          </button>
          <button 
            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1 rounded text-xs" 
            onClick={() => handleViewRelationships(record)}
          >
            关系
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
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">资产管理</h1>
        <p className="mt-1 text-sm text-gray-500">统一管理和追踪所有IT资产配置信息</p>
      </div>

      {/* 操作栏 */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex space-x-2 flex-wrap">
            <button 
              className={`px-4 py-2 border rounded-md text-sm ${activeType === null ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => handleTypeChange(null)}
            >
              全部
            </button>
            <button 
              className={`px-4 py-2 border rounded-md text-sm ${activeType === 'cabinet' ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => handleTypeChange('cabinet')}
            >
              机柜
            </button>
            <button 
              className={`px-4 py-2 border rounded-md text-sm ${activeType === 'physical' ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => handleTypeChange('physical')}
            >
              物理机
            </button>
            <button 
              className={`px-4 py-2 border rounded-md text-sm ${activeType === 'virtualization' ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => handleTypeChange('virtualization')}
            >
              虚拟化
            </button>
            <button 
              className={`px-4 py-2 border rounded-md text-sm ${activeType === 'vm' ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => handleTypeChange('vm')}
            >
              虚拟机
            </button>
            <button 
              className={`px-4 py-2 border rounded-md text-sm ${activeType === 'container' ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => handleTypeChange('container')}
            >
              容器化
            </button>
            <button 
              className={`px-4 py-2 border rounded-md text-sm ${activeType === 'network' ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => handleTypeChange('network')}
            >
              网络设备
            </button>
            <button 
              className={`px-4 py-2 border rounded-md text-sm ${activeType === 'application' ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => handleTypeChange('application')}
            >
              应用服务
            </button>
            <button 
              className={`px-4 py-2 border rounded-md text-sm ${activeType === 'middleware' ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => handleTypeChange('middleware')}
            >
              中间件
            </button>
            <button 
              className={`px-4 py-2 border rounded-md text-sm ${activeType === 'database' ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => handleTypeChange('database')}
            >
              数据库
            </button>
            <button 
              className={`px-4 py-2 border rounded-md text-sm ${activeType === 'cloud' ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => handleTypeChange('cloud')}
            >
              云资源
            </button>
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center ml-2"
              onClick={handleCreateItem}
            >
              <i className="fa fa-plus mr-2"></i>
              新建
            </button>
          </div>
          <div className="flex space-x-2 items-center">
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.environment}
              onChange={(e) => setFilters({...filters, environment: e.target.value})}
            >
              <option value="">所有环境</option>
              <option value="dev">开发</option>
              <option value="test">测试</option>
              <option value="staging">预生产</option>
              <option value="prod">生产</option>
            </select>
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="">所有状态</option>
              <option value="active">运行中</option>
              <option value="inactive">已停用</option>
              <option value="maintenance">维护中</option>
            </select>
            {/* 智能搜索框 - 精美设计 */}
            <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
              {/* 搜索图标 */}
              <div className="pl-3 pr-2 text-gray-400">
                <i className="fa fa-search"></i>
              </div>
              
              {/* 搜索输入框 */}
              <input
                type="text"
                placeholder={searchField === 'all' ? "搜索所有字段..." : `搜索${getSearchFieldLabel(searchField)}...`}
                className="flex-1 px-2 py-2.5 text-sm border-0 focus:outline-none focus:ring-0"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              
              {/* 匹配模式切换按钮 */}
              <button
                className={`px-3 py-2.5 text-sm border-l border-gray-200 transition-colors ${searchMode === 'exact' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setSearchMode(searchMode === 'exact' ? 'fuzzy' : 'exact')}
                title={searchMode === 'exact' ? '精确匹配模式' : '模糊匹配模式'}
              >
                {searchMode === 'exact' ? '精确' : '模糊'}
              </button>
              
              {/* 字段选择器 */}
              <div className="relative">
                <select
                  className="appearance-none bg-transparent border-0 pl-2 pr-8 py-2.5 text-sm text-gray-600 focus:outline-none focus:ring-0 cursor-pointer"
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                >
                  <option value="all">🔍 所有字段</option>
                  <option value="name">📝 名称</option>
                  <option value="ip">🌐 IP地址</option>
                  <option value="hostname">🖥️ 主机名</option>
                  <option value="businessLine">🏢 业务线</option>
                  <option value="owner">👤 负责人</option>
                  <option value="sshUsername">👤 SSH用户名</option>
                  <option value="sshPort">🔌 SSH端口</option>
                  <option value="tags">🏷️ 标签</option>
                  <option value="os">💻 操作系统</option>
                  <option value="deviceType">🏢 设备类型</option>
                  <option value="location">📍 位置</option>
                  <option value="version">📊 版本</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                  <i className="fa fa-chevron-down text-xs"></i>
                </div>
              </div>
              
              {/* 清除按钮 */}
              {searchKeyword && (
                <button
                  className="px-3 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setSearchKeyword('')}
                  title="清除搜索"
                >
                  <i className="fa fa-times"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 配置项列表 */}
      <div className="bg-white rounded-lg shadow-sm">
          <DataTable
            columns={columns}
            dataSource={paginatedItems}
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: filteredItems.length,
              onChange: handlePageChange,
            }}
          />
        </div>

      {/* 详情模态框 */}
      <Modal
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        title="配置项详情"
        width={1000}
        className="shadow-xl"
        footer={(
          <div className="flex justify-end space-x-2 p-4">
            <button
              className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setDetailModalVisible(false)}
            >
              关闭
            </button>
          </div>
        )}
      >
        {selectedItem && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">{selectedItem.name}</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(selectedItem.status)}`}>
                  {selectedItem.status === 'active' ? '运行中' : selectedItem.status === 'inactive' ? '已停用' : '维护中'}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEnvironmentClass(selectedItem.environment)}`}>
                  {selectedItem.environment === 'dev' ? '开发' : selectedItem.environment === 'test' ? '测试' : selectedItem.environment === 'staging' ? '预生产' : '生产'}
                </span>
              </div>
            </div>
            
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">类型：&nbsp;&nbsp;</span>
                  <span className="font-medium text-gray-900">
                    {selectedItem.type === 'network' ? '网络设备' : 
                     selectedItem.type === 'application' ? '应用服务' : 
                     selectedItem.type === 'middleware' ? '中间件' : 
                     selectedItem.type === 'database' ? '数据库' : 
                     selectedItem.type === 'cloud' ? '云资源' : 
                     selectedItem.type === 'cabinet' ? '机柜' : 
                     selectedItem.type === 'physical' ? '物理机' : 
                     selectedItem.type === 'virtualization' ? '虚拟化' : 
                     selectedItem.type === 'vm' ? '虚拟机' : '容器化'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">业务线：&nbsp;&nbsp;</span>
                  <span className="font-medium text-gray-900">{selectedItem.businessLine}</span>
                </div>
                <div>
                  <span className="text-gray-500">负责人：&nbsp;&nbsp;</span>
                  <span className="font-medium text-gray-900">{selectedItem.owner}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 text-sm mt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="whitespace-nowrap">
                    <span className="text-gray-500">创建时间：&nbsp;&nbsp;</span>
                    <span className="font-medium text-gray-900">{selectedItem.createTime}</span>
                  </div>
                  <div className="whitespace-nowrap">
                    <span className="text-gray-500">更新时间：&nbsp;&nbsp;</span>
                    <span className="font-medium text-gray-900">{selectedItem.updateTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 网络设备特有信息 */}
            {selectedItem.type === 'network' && (
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">网络设备信息</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">设备类型：</span>
                    <span className="font-medium text-gray-900">{selectedItem.deviceType}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">位置：</span>
                    <span className="font-medium text-gray-900">{selectedItem.location}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 应用服务特有信息 */}
            {selectedItem.type === 'application' && (
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
                <h4 className="font-medium text-gray-900 mb-2">应用服务信息</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="text-gray-600 font-medium">版本：</span>
                    <span className="font-mono font-medium">{selectedItem.version}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">部署路径：</span>
                    <span className="font-mono font-medium">{selectedItem.deployPath}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 中间件特有信息 */}
            {selectedItem.type === 'middleware' && (
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
                <h4 className="font-medium text-gray-900 mb-2">中间件信息</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="text-gray-600 font-medium">中间件类型：</span>
                    <span className="font-medium text-gray-900">{selectedItem.middlewareType}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">版本：</span>
                    <span className="font-mono font-medium">{selectedItem.version || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">连接地址：</span>
                    <span className="font-mono font-medium">{selectedItem.connectionString || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">端口：</span>
                    <span className="font-mono font-medium">{selectedItem.port || '-'}</span>
                  </div>
                  {/* 数据库特有信息 */}
                  {(selectedItem.dbType && selectedItem.dbType !== 'none') && (
                    <>
                      <div>
                        <span className="text-gray-600 font-medium">数据库类型：</span>
                        <span className="font-medium text-gray-900">{selectedItem.dbType}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">数据库名称：</span>
                        <span className="font-mono font-medium">{selectedItem.databaseName || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">存储大小：</span>
                        <span className="font-mono font-medium">{selectedItem.storageSize ? `${selectedItem.storageSize}GB` : '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">备份策略：</span>
                        <span className="font-mono font-medium">{selectedItem.backupPolicy || '-'}</span>
                      </div>
                    </>
                  )}
                  {/* 消息队列特有信息 */}
                  {(selectedItem.mqType && selectedItem.mqType !== 'none') && (
                    <>
                      <div>
                        <span className="text-gray-600 font-medium">队列类型：</span>
                        <span className="font-medium text-gray-900">{selectedItem.mqType}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">队列名称：</span>
                        <span className="font-mono font-medium">{selectedItem.queueName || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">消息模式：</span>
                        <span className="font-mono font-medium">{selectedItem.messageModel || '-'}</span>
                      </div>
                    </>
                  )}
                  {/* 应用服务器特有信息 */}
                  {(selectedItem.appServerType && selectedItem.appServerType !== 'none') && (
                    <>
                      <div>
                        <span className="text-gray-600 font-medium">应用服务器类型：</span>
                        <span className="font-medium text-gray-900">{selectedItem.appServerType}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">部署路径：</span>
                        <span className="font-mono font-medium">{selectedItem.deployPath || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">JVM参数：</span>
                        <span className="font-mono font-medium text-xs">{selectedItem.jvmParams || '-'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 数据库特有信息 */}
            {selectedItem.type === 'database' && (
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">数据库信息</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">数据库类型：</span>
                    <span className="font-medium text-gray-900">{selectedItem.dbType}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">版本：</span>
                    <span className="font-mono font-medium">{selectedItem.version || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">连接地址：</span>
                    <span className="font-mono font-medium">{selectedItem.connectionString || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">数据库名称：</span>
                    <span className="font-mono font-medium">{selectedItem.databaseName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">实例名称：</span>
                    <span className="font-mono font-medium">{selectedItem.instanceName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">存储大小：</span>
                    <span className="font-mono font-medium">{selectedItem.storageSize ? `${selectedItem.storageSize}GB` : '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">备份策略：</span>
                    <span className="font-mono font-medium">{selectedItem.backupPolicy || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">用户名：</span>
                    <span className="font-mono font-medium">{selectedItem.username || '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 云资源特有信息 */}
            {selectedItem.type === 'cloud' && (
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
                <h4 className="font-medium text-gray-900 mb-2">云资源信息</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="text-gray-600 font-medium">云供应商：</span>
                    <span className="font-medium text-gray-900">{selectedItem.cloudProvider}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">区域：</span>
                    <span className="font-medium text-gray-900">{selectedItem.region}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 连接信息 */}
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
              <h4 className="font-medium text-gray-900 mb-2">标签</h4>
              <div className="flex flex-wrap gap-2">
                {selectedItem.tags.filter(tag => tag).map((tag, index) => {
                  const tagInfo = tags.find(t => t.name === tag);
                  return (
                    <span 
                      key={index} 
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tagInfo?.color || 'bg-gray-100 text-gray-800'}`}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 编辑模态框 */}
      <Modal
        visible={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
        }}
        title="编辑配置项"
        width={800}
        className="shadow-xl"
        footer={(
          <div className="flex justify-end p-4 space-x-2">
            <button
              className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setEditModalVisible(false);
              }}
            >
              取消
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              onClick={() => editingItem && handleSaveItem(editingItem)}
            >
              保存
            </button>
          </div>
        )}
      >
        {editingItem && (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            <div className="p-4 space-y-4">
              <h3 className="text-lg font-semibold">基本信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap"><span className="text-red-500">*</span>名称</label>
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap"><span className="text-red-500">*</span>类型</label>
                  <select
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingItem.type}
                    onChange={(e) => setEditingItem({...editingItem, type: e.target.value as ConfigurationItemType})}
                    disabled={!createModalVisible}
                  >
                    <option value="network">网络设备</option>
                    <option value="application">应用服务</option>
                    <option value="middleware">中间件</option>
                    <option value="database">数据库</option>
                    <option value="cloud">云资源</option>
                    <option value="cabinet">机柜</option>
                    <option value="physical">物理机</option>
                    <option value="virtualization">虚拟化</option>
                    <option value="vm">虚拟机</option>
                    <option value="container">容器化</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap"><span className="text-red-500">*</span>状态</label>
                  <select
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingItem.status}
                    onChange={(e) => setEditingItem({...editingItem, status: e.target.value as 'active' | 'inactive' | 'maintenance'})}
                  >
                    <option value="active">运行中</option>
                    <option value="inactive">已停用</option>
                    <option value="maintenance">维护中</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap"><span className="text-red-500">*</span>环境</label>
                  <select
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingItem.environment}
                    onChange={(e) => setEditingItem({...editingItem, environment: e.target.value as 'dev' | 'test' | 'staging' | 'prod'})}
                  >
                    <option value="dev">开发</option>
                    <option value="test">测试</option>
                    <option value="staging">预生产</option>
                    <option value="prod">生产</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">业务线</label>
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingItem.businessLine}
                    onChange={(e) => setEditingItem({...editingItem, businessLine: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">负责人</label>
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingItem.owner}
                    onChange={(e) => setEditingItem({...editingItem, owner: e.target.value})}
                  />
                </div>
              </div>
            </div>
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
                      onChange={(e) => setEditingItem({...editingItem, sshUsername: e.target.value.trim() || undefined})}
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
                      onChange={(e) => setEditingItem({...editingItem, sshPassword: e.target.value.trim() || undefined})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 根据类型显示不同的字段 */}

            {/* 中间件特有字段 */}
            {editingItem.type === 'middleware' && (
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
                <h4 className="text-lg font-semibold mb-3">中间件详情</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">中间件类型</label>
                      <select
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={editingItem.middlewareCategory || ''}
                        onChange={(e) => setEditingItem({...editingItem, middlewareCategory: e.target.value as MiddlewareCategory})}
                      >
                        <option value="">请选择</option>
                        <option value="database">数据库</option>
                        <option value="message-queue">消息队列</option>
                        <option value="app-server">应用服务器</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">版本</label>
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={editingItem.version || ''}
                        onChange={(e) => setEditingItem({...editingItem, version: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">连接地址</label>
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={editingItem.connectionString || ''}
                        onChange={(e) => setEditingItem({...editingItem, connectionString: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">端口</label>
                      <input
                        type="number"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={editingItem.port || ''}
                        onChange={(e) => setEditingItem({...editingItem, port: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  
                  {/* 数据库特有字段 */}
                  {editingItem.middlewareCategory === 'database' && (
                    <>
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">数据库类型</label>
                          <select
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={editingItem.dbType || 'none'}
                            onChange={(e) => setEditingItem({...editingItem, dbType: e.target.value})}
                          >
                            <option value="none">请选择</option>
                            <option value="Oracle">Oracle</option>
                            <option value="MySQL">MySQL</option>
                            <option value="MongoDB">MongoDB</option>
                            <option value="Redis">Redis</option>
                            <option value="OceanBase">OceanBase</option>
                            <option value="TiDB">TiDB</option>
                            <option value="TDSQL">TDSQL</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">数据库名称</label>
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={editingItem.databaseName || ''}
                            onChange={(e) => setEditingItem({...editingItem, databaseName: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">存储大小 (GB)</label>
                          <input
                            type="number"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={editingItem.storageSize || 0}
                            onChange={(e) => setEditingItem({...editingItem, storageSize: parseInt(e.target.value) || 0})}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">备份策略</label>
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={editingItem.backupPolicy || ''}
                            onChange={(e) => setEditingItem({...editingItem, backupPolicy: e.target.value})}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* 消息队列特有字段 */}
                  {editingItem.middlewareCategory === 'message-queue' && (
                    <>
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">队列类型</label>
                          <select
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={editingItem.mqType || 'none'}
                            onChange={(e) => setEditingItem({...editingItem, mqType: e.target.value})}
                          >
                            <option value="none">请选择</option>
                            <option value="RabbitMQ">RabbitMQ</option>
                            <option value="Kafka">Kafka</option>
                            <option value="RocketMQ">RocketMQ</option>
                            <option value="ActiveMQ">ActiveMQ</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">队列名称</label>
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={editingItem.queueName || ''}
                            onChange={(e) => setEditingItem({...editingItem, queueName: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">消息模式</label>
                          <select
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={editingItem.messageModel || 'none'}
                            onChange={(e) => setEditingItem({...editingItem, messageModel: e.target.value})}
                          >
                            <option value="none">请选择</option>
                            <option value="点对点">点对点</option>
                            <option value="发布/订阅">发布/订阅</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* 应用服务器特有字段 */}
                  {editingItem.middlewareCategory === 'app-server' && (
                    <>
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">应用服务器类型</label>
                          <select
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={editingItem.appServerType || 'none'}
                            onChange={(e) => setEditingItem({...editingItem, appServerType: e.target.value})}
                          >
                            <option value="none">请选择</option>
                            <option value="Tomcat">Tomcat</option>
                            <option value="WebLogic">WebLogic</option>
                            <option value="WebSphere">WebSphere</option>
                            <option value="JBoss">JBoss</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">部署路径</label>
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={editingItem.deployPath || ''}
                            onChange={(e) => setEditingItem({...editingItem, deployPath: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">JVM参数</label>
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={editingItem.jvmParams || ''}
                            onChange={(e) => setEditingItem({...editingItem, jvmParams: e.target.value})}
                            placeholder="例如: -Xms2g -Xmx4g"
                          />
                        </div>
                      </div>
                    </>
                  )}

                </div>
              </div>
            )}

            {/* 标签管理 */}
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
              <h4 className="text-lg font-semibold mb-3">标签管理</h4>
              <div className="flex items-center mb-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">标签名称</label>
                <input
                  type="text"
                  className="flex-1 px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ml-[-2px]"
                  placeholder="请输入标签名称，多个标签用逗号分隔"
                  value={editingItem.tags.join(', ')}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    // 按逗号分割，支持中文逗号和英文逗号
                    const tags = inputValue
                      .split(/[,,]/)
                      .map(tag => tag.trim())
                      .filter(tag => tag);
                    setEditingItem({...editingItem, tags});
                  }}
                  onBlur={(e) => {
                    // 失去焦点时，确保清理空标签
                    const inputValue = e.target.value;
                    const tags = inputValue
                      .split(/[,,]/)
                      .map(tag => tag.trim())
                      .filter(tag => tag);
                    setEditingItem({...editingItem, tags});
                  }}
                />
              </div>
              {editingItem.tags.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm text-gray-500 mb-2">已添加标签：</div>
                  <div className="flex flex-wrap gap-2">
                    {editingItem.tags.map((tag, index) => (
                      <div key={index} className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                        {tag}
                        <button
                          type="button"
                          className="ml-1 text-blue-500 hover:text-blue-700"
                          onClick={() => {
                            const newTags = [...editingItem.tags];
                            newTags.splice(index, 1);
                            setEditingItem({...editingItem, tags: newTags});
                          }}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* 关系管理 */}
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100 mt-4">
              <h4 className="text-lg font-semibold mb-3">关系管理</h4>
              <div className="mb-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700">选择相关配置项</label>
                  {/* 搜索 + 类型过滤 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="搜索名称..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={relModalSearch}
                      onChange={(e) => setRelModalSearch(e.target.value)}
                    />
                    <select
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={relModalTypeFilter}
                      onChange={(e) => setRelModalTypeFilter(e.target.value)}
                    >
                      <option value="">所有类型</option>
                      <option value="network">网络设备</option>
                      <option value="application">应用服务</option>
                      <option value="middleware">中间件</option>
                      <option value="database">数据库</option>
                      <option value="cloud">云资源</option>
                      <option value="cabinet">机柜</option>
                      <option value="physical">物理机</option>
                      <option value="virtualization">虚拟化</option>
                      <option value="vm">虚拟机</option>
                      <option value="container">容器化</option>
                    </select>
                  </div>
                  {/* 结果列表（带滚动） */}
                  <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white">
                    {filteredSelectableTargets.length === 0 ? (
                      <div className="text-center text-gray-400 py-4 text-sm">无匹配资产</div>
                    ) : (
                      filteredSelectableTargets.map(item => {
                        const isSelected = relationshipTarget === item.id;
                        const typeMap: Record<string, string> = {
                          host: '主机', network: '网络设备', application: '应用服务',
                          middleware: '中间件', database: '数据库', cloud: '云资源',
                          cabinet: '机柜', physical: '物理机', virtualization: '虚拟化',
                          vm: '虚拟机', container: '容器化'
                        };
                        return (
                          <div
                            key={item.id}
                            className={`px-3 py-2 cursor-pointer flex items-center justify-between text-sm hover:bg-blue-50 ${isSelected ? 'bg-blue-100 font-medium' : ''}`}
                            onClick={() => setRelationshipTarget(item.id)}
                          >
                            <span>{item.name}</span>
                            <span className="text-xs text-gray-400">{typeMap[item.type] || item.type}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 mt-3">
                  <label className="text-sm font-medium text-gray-700">关系类型</label>
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={relationshipType || ''}
                    onChange={(e) => setRelationshipType(e.target.value)}
                  >
                    <option value="">请选择关系类型</option>
                    <option value="uses">使用</option>
                    <option value="depends">依赖</option>
                    <option value="contains">包含</option>
                    <option value="connects">连接</option>
                    <option value="hosts">宿主</option>
                    <option value="provides">提供</option>
                  </select>
                </div>
                
                <button
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  onClick={handleAddRelationship}
                  disabled={!relationshipTarget || !relationshipType}
                >
                  添加关系
                </button>
              </div>
              
              {/* 已添加的关系列表 */}
              {currentRelationships.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">已添加关系：</div>
                  <div className="space-y-2">
                    {currentRelationships.map((rel, index) => {
                      const relatedItem = configItems.find(item => item.id === rel.target);
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                          <div>
                            <div className="font-medium text-gray-900">
                              {relatedItem?.name || '未知配置项'}
                            </div>
                            <div className="text-xs text-gray-500">
                              关系：{rel.type === 'uses' ? '使用' : 
                                rel.type === 'depends' ? '依赖' : 
                                rel.type === 'contains' ? '包含' : 
                                rel.type === 'connects' ? '连接' : 
                                rel.type === 'hosts' ? '宿主' : '提供'}
                            </div>
                          </div>
                          <button
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleRemoveRelationship(index)}
                          >
                            删除
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}</Modal>

      {/* 新建模态框 */}
      <Modal
        visible={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
        }}
        title="新建配置项"
        width={800}
        className="shadow-xl"
        footer={(
          <div className="flex justify-end p-4 space-x-2">
            <button
              className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setCreateModalVisible(false);
              }}
            >
              取消
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              onClick={() => editingItem && handleSaveItem(editingItem)}
            >
              保存
            </button>
          </div>
        )}
      >
        {editingItem && (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            <div className="p-4 space-y-4">
              <h3 className="text-lg font-semibold">基本信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap"><span className="text-red-500">*</span>名称</label>
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap"><span className="text-red-500">*</span>类型</label>
                  <select
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingItem.type}
                    onChange={(e) => setEditingItem({...editingItem, type: e.target.value as ConfigurationItemType})}
                  >
                    <option value="network">网络设备</option>
                    <option value="application">应用服务</option>
                    <option value="middleware">中间件</option>
                    <option value="database">数据库</option>
                    <option value="cloud">云资源</option>
                    <option value="cabinet">机柜</option>
                    <option value="physical">物理机</option>
                    <option value="virtualization">虚拟化</option>
                    <option value="vm">虚拟机</option>
                    <option value="container">容器化</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap"><span className="text-red-500">*</span>状态</label>
                  <select
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingItem.status}
                    onChange={(e) => setEditingItem({...editingItem, status: e.target.value as 'active' | 'inactive' | 'maintenance'})}
                  >
                    <option value="active">运行中</option>
                    <option value="inactive">已停用</option>
                    <option value="maintenance">维护中</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap"><span className="text-red-500">*</span>环境</label>
                  <select
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingItem.environment}
                    onChange={(e) => setEditingItem({...editingItem, environment: e.target.value as 'dev' | 'test' | 'staging' | 'prod'})}
                  >
                    <option value="dev">开发</option>
                    <option value="test">测试</option>
                    <option value="staging">预生产</option>
                    <option value="prod">生产</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">业务线</label>
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingItem.businessLine}
                    onChange={(e) => setEditingItem({...editingItem, businessLine: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 w-32 whitespace-nowrap">负责人</label>
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingItem.owner}
                    onChange={(e) => setEditingItem({...editingItem, owner: e.target.value})}
                  />
                </div>
              </div>
            </div>
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
                      onChange={(e) => setEditingItem({...editingItem, sshUsername: e.target.value.trim() || undefined})}
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
                      onChange={(e) => setEditingItem({...editingItem, sshPassword: e.target.value.trim() || undefined})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 标签管理 */}
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
              <h4 className="text-lg font-semibold mb-3">标签管理</h4>
              <div className="flex items-center mb-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">标签名称</label>
                <input
                  type="text"
                  className="flex-1 px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ml-[-2px]"
                  placeholder="请输入标签名称，多个标签用逗号分隔"
                  value={editingItem.tags.join(', ')}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    const tags = inputValue.split(/[,，]/).map(tag => tag.trim()).filter(tag => tag);
                    setEditingItem({...editingItem, tags});
                  }}
                />
              </div>
            </div>
            
            {/* 关系管理 */}
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100 mt-4">
              <h4 className="text-lg font-semibold mb-3">关系管理</h4>
              <div className="mb-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700">选择相关配置项</label>
                  {/* 搜索 + 类型过滤 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="搜索名称..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={relModalSearch}
                      onChange={(e) => setRelModalSearch(e.target.value)}
                    />
                    <select
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={relModalTypeFilter}
                      onChange={(e) => setRelModalTypeFilter(e.target.value)}
                    >
                      <option value="">所有类型</option>
                      <option value="network">网络设备</option>
                      <option value="application">应用服务</option>
                      <option value="middleware">中间件</option>
                      <option value="database">数据库</option>
                      <option value="cloud">云资源</option>
                      <option value="cabinet">机柜</option>
                      <option value="physical">物理机</option>
                      <option value="virtualization">虚拟化</option>
                      <option value="vm">虚拟机</option>
                      <option value="container">容器化</option>
                    </select>
                  </div>
                  {/* 结果列表（带滚动） */}
                  <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white">
                    {filteredSelectableTargets.length === 0 ? (
                      <div className="text-center text-gray-400 py-4 text-sm">无匹配资产</div>
                    ) : (
                      filteredSelectableTargets.map(item => {
                        const isSelected = relationshipTarget === item.id;
                        const typeMap: Record<string, string> = {
                          host: '主机', network: '网络设备', application: '应用服务',
                          middleware: '中间件', database: '数据库', cloud: '云资源',
                          cabinet: '机柜', physical: '物理机', virtualization: '虚拟化',
                          vm: '虚拟机', container: '容器化'
                        };
                        return (
                          <div
                            key={item.id}
                            className={`px-3 py-2 cursor-pointer flex items-center justify-between text-sm hover:bg-blue-50 ${isSelected ? 'bg-blue-100 font-medium' : ''}`}
                            onClick={() => setRelationshipTarget(item.id)}
                          >
                            <span>{item.name}</span>
                            <span className="text-xs text-gray-400">{typeMap[item.type] || item.type}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 mt-3">
                  <label className="text-sm font-medium text-gray-700">关系类型</label>
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={relationshipType || ''}
                    onChange={(e) => setRelationshipType(e.target.value)}
                  >
                    <option value="">请选择关系类型</option>
                    <option value="uses">使用</option>
                    <option value="depends">依赖</option>
                    <option value="contains">包含</option>
                    <option value="connects">连接</option>
                    <option value="hosts">宿主</option>
                    <option value="provides">提供</option>
                  </select>
                </div>
                
                <button
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  onClick={handleAddRelationship}
                  disabled={!relationshipTarget || !relationshipType}
                >
                  添加关系
                </button>
              </div>
              
              {/* 已添加的关系列表 */}
              {currentRelationships.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">已添加关系：</div>
                  <div className="space-y-2">
                    {currentRelationships.map((rel, index) => {
                      const relatedItem = configItems.find(item => item.id === rel.target);
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                          <div>
                            <div className="font-medium text-gray-900">
                              {relatedItem?.name || '未知配置项'}
                            </div>
                            <div className="text-xs text-gray-500">
                              关系类型: {rel.type === 'uses' ? '使用' : 
                                      rel.type === 'depends' ? '依赖' : 
                                      rel.type === 'contains' ? '包含' : 
                                      rel.type === 'connects' ? '连接' : 
                                      rel.type === 'hosts' ? '宿主' : '提供'}
                            </div>
                          </div>
                          <button
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleRemoveRelationship(index)}
                          >
                            删除
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}</Modal>

        {/* 关系拓扑模态框 */}
        <Modal
          visible={relationshipModalVisible}
          onCancel={() => setRelationshipModalVisible(false)}
          title={selectedItem ? `${selectedItem.name} - 关系拓扑` : "配置项关系拓扑"}
          width={1100}
          className="shadow-xl"
          footer={(
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setRelationshipModalVisible(false)}
              >
                关闭
              </button>
            </div>
          )}
        >
          {selectedItem && (
            <div className="space-y-4" style={{ maxHeight: 'calc(80vh - 160px)', overflowY: 'auto' }}>
              <div className="border border-gray-200 rounded-lg bg-white shadow-sm" style={{ height: 500, minHeight: 400 }}>
                <TopologyChart
                  configItems={configItems}
                  relationships={relationships}
                  selectedItemId={selectedItem.id}
                  height={500}
                />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">相关配置项</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                  {relationships
                    .filter(rel => rel.source === selectedItem.id || rel.target === selectedItem.id)
                    .map((rel, index) => {
                      const relatedItem = rel.source === selectedItem.id 
                        ? configItems.find(item => item.id === rel.target)
                        : configItems.find(item => item.id === rel.source);
                      const relationType = rel.source === selectedItem.id ? '使用' : '被使用';
                      
                      return relatedItem ? (
                        <div key={index} className="flex items-start p-2 bg-gray-50 rounded text-sm">
                          <div className="flex-grow">
                            <div className="font-medium text-gray-900 flex items-center">
                              {relatedItem.name}
                              <span className="ml-2 text-xs text-gray-500">({relatedItem.type === 'network' ? '网络设备' : 
                                relatedItem.type === 'application' ? '应用服务' : 
                                relatedItem.type === 'middleware' ? '中间件' : '云资源'})
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">关系: {relationType} ({rel.type})</div>
                          </div>
                          <button 
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs"
                            onClick={() => {
                              setSelectedItem(relatedItem);
                              setRelationshipModalVisible(false);
                              setDetailModalVisible(true);
                            }}
                          >
                            查看
                          </button>
                        </div>
                      ) : null;
                    })}
                  {relationships.filter(rel => rel.source === selectedItem.id || rel.target === selectedItem.id).length === 0 && (
                    <div className="text-center text-gray-500 py-4">暂无相关配置项</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

export default AssetManagement;
