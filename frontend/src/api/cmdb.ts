import apiClient from './client';

// 定义配置项类型
export type ConfigurationItemType = 'host' | 'network' | 'application' | 'middleware' | 'database' | 'cloud' | 'cabinet' | 'physical' | 'virtualization' | 'vm' | 'container';

export type StatusType = 'active' | 'inactive' | 'maintenance';

export type EnvironmentType = 'dev' | 'test' | 'staging' | 'prod';

// 定义配置项接口
export interface ConfigurationItem {
  id: string;
  name: string;
  type: ConfigurationItemType;
  status: StatusType;
  environment: EnvironmentType;
  businessLine: string;
  owner: string;
  createTime: string;
  updateTime: string;
  tags: string[];
  // 主机特有属性
  ip?: string;
  hostname?: string;
  os?: string;
  cpu?: number;
  memory?: number;
  disk?: number;
  sshPort?: number;
  sshUsername?: string;
  sshPassword?: string;
  sshPrivateKey?: string;
  // 网络设备特有属性
  deviceType?: string;
  location?: string;
  // 应用服务特有属性
  version?: string;
  deployPath?: string;
  // 中间件特有属性
  middlewareType?: string;
  middlewareCategory?: string;
  port?: number;
  username?: string;
  // 数据库特有属性
  dbType?: string;
  databaseName?: string;
  instanceName?: string;
  storageSize?: number;
  backupPolicy?: string;
  connectionString?: string;
  // 消息队列特有属性
  mqType?: string;
  queueName?: string;
  messageModel?: string;
  // 应用服务器特有属性
  appServerType?: string;
  jvmParams?: string;
  // 云资源特有属性
  cloudProvider?: string;
  region?: string;
  // 标签类型映射
  tagTypes?: Record<number, string>;
}

// 定义标签接口
export interface Tag {
  id: string;
  name: string;
  color: string;
}

// 定义关系接口
export interface Relationship {
  id: number;
  source: string;
  target: string;
  type: string;
}

// 获取配置项列表（支持多条件过滤）
export const getConfigItems = async (filters?: {
  type?: ConfigurationItemType;
  types?: ConfigurationItemType[];  // 支持多类型
  environment?: EnvironmentType;
  keyword?: string;
  businessLine?: string;
}): Promise<ConfigurationItem[]> => {
  try {
    const params: Record<string, string> = {};
    if (filters?.types && filters.types.length > 0) {
      params.types = filters.types.join(',');
    } else if (filters?.type) {
      params.type = filters.type;
    }
    if (filters?.environment) params.environment = filters.environment;
    if (filters?.keyword) params.keyword = filters.keyword;
    if (filters?.businessLine) params.business_line = filters.businessLine;
    const response = await apiClient.get('/api/cmdb/config-items', { params });
    const data = response.data || [];
    if (!Array.isArray(data)) {
      return [];
    }
    return data.map((item: any) => ({
      ...item,
      businessLine: item.business_line || '',
      createTime: item.create_time || new Date().toLocaleString('zh-CN'),
      updateTime: item.update_time ? new Date(item.update_time).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN'),
      deviceType: item.device_type,
      deployPath: item.deploy_path,
      middlewareType: item.middleware_type,
      middlewareCategory: item.middleware_category,
      databaseName: item.database_name,
      instanceName: item.instance_name,
      storageSize: item.storage_size,
      backupPolicy: item.backup_policy,
      connectionString: item.connection_string,
      mqType: item.mq_type,
      queueName: item.queue_name,
      messageModel: item.message_model,
      appServerType: item.app_server_type,
      jvmParams: item.jvm_params,
      cloudProvider: item.cloud_provider,
      region: item.region,
      sshPort: item.ssh_port,
      sshUsername: item.ssh_username,
      sshPassword: item.ssh_password,
      sshPrivateKey: item.ssh_private_key,
      tags: item.tags || []
    }));
  } catch (error) {
    console.error('Error fetching config items:', error);
    return [];
  }
};

// 获取单个配置项
export const getConfigItem = async (id: string): Promise<ConfigurationItem> => {
  try {
    const response = await apiClient.get(`/api/cmdb/config-items/${id}`);
    const item = response.data;
    return {
      ...item,
      businessLine: item.business_line || '',
      createTime: item.create_time || new Date().toLocaleString('zh-CN'),
      updateTime: item.update_time ? new Date(item.update_time).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN'),
      deviceType: item.device_type,
      deployPath: item.deploy_path,
      middlewareType: item.middleware_type,
      middlewareCategory: item.middleware_category,
      databaseName: item.database_name,
      instanceName: item.instance_name,
      storageSize: item.storage_size,
      backupPolicy: item.backup_policy,
      connectionString: item.connection_string,
      mqType: item.mq_type,
      queueName: item.queue_name,
      messageModel: item.message_model,
      appServerType: item.app_server_type,
      jvmParams: item.jvm_params,
      cloudProvider: item.cloud_provider,
      region: item.region,
      sshPort: item.ssh_port,
      sshUsername: item.ssh_username,
      sshPassword: item.ssh_password,
      sshPrivateKey: item.ssh_private_key,
      tags: item.tags || [] // 确保 tags 是数组而不是 null
    };
  } catch (error) {
    console.error(`Error fetching config item ${id}:`, error);
    // 返回默认配置项对象
    return {
      id,
      name: '未知配置项',
      type: 'host',
      status: 'inactive',
      environment: 'dev',
      businessLine: '',
      owner: '',
      createTime: new Date().toLocaleString('zh-CN'),
      updateTime: new Date().toLocaleString('zh-CN'),
      tags: []
    };
  }
};

// 创建配置项
export const createConfigItem = async (item: Omit<ConfigurationItem, 'id' | 'createTime' | 'updateTime'>): Promise<ConfigurationItem> => {
  try {
    // 只发送蛇形字段，过滤 undefined 和驼峰字段
    const payload: Record<string, any> = {
      name: item.name,
      type: item.type,
      status: item.status || 'active',
      environment: item.environment || 'dev',
      business_line: item.businessLine || null,
      owner: item.owner || null,
      tags: item.tags || [],
      ip: item.ip || null,
      hostname: item.hostname || null,
      os: item.os || null,
      cpu: item.cpu || null,
      memory: item.memory || null,
      disk: item.disk || null,
      ssh_port: item.sshPort || null,
      ssh_username: item.sshUsername || null,
      ssh_password: item.sshPassword || null,
      ssh_private_key: item.sshPrivateKey || null,
      device_type: item.deviceType || null,
      location: item.location || null,
      version: item.version || null,
      deploy_path: item.deployPath || null,
      middleware_type: item.middlewareType || null,
      middleware_category: item.middlewareCategory || null,
      port: item.port || null,
      username: item.username || null,
      db_type: item.dbType || null,
      database_name: item.databaseName || null,
      instance_name: item.instanceName || null,
      storage_size: item.storageSize || null,
      backup_policy: item.backupPolicy || null,
      connection_string: item.connectionString || null,
      mq_type: item.mqType || null,
      queue_name: item.queueName || null,
      message_model: item.messageModel || null,
      app_server_type: item.appServerType || null,
      jvm_params: item.jvmParams || null,
      cloud_provider: item.cloudProvider || null,
      region: item.region || null
    };
    // 过滤掉 null 值
    Object.keys(payload).forEach(key => {
      if (payload[key] === null || payload[key] === undefined) {
        delete payload[key];
      }
    });
    const response = await apiClient.post('/api/cmdb/config-items', payload);
    const createdItem = response.data;
    return {
      ...createdItem,
      businessLine: createdItem.business_line || '',
      createTime: createdItem.create_time || new Date().toLocaleString('zh-CN'),
      updateTime: createdItem.update_time ? new Date(createdItem.update_time).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN'),
      deviceType: createdItem.device_type,
      deployPath: createdItem.deploy_path,
      middlewareType: createdItem.middleware_type,
      middlewareCategory: createdItem.middleware_category,
      databaseName: createdItem.database_name,
      instanceName: createdItem.instance_name,
      storageSize: createdItem.storage_size,
      backupPolicy: createdItem.backup_policy,
      connectionString: createdItem.connection_string,
      mqType: createdItem.mq_type,
      queueName: createdItem.queue_name,
      messageModel: createdItem.message_model,
      appServerType: createdItem.app_server_type,
      jvmParams: createdItem.jvm_params,
      cloudProvider: createdItem.cloud_provider,
      region: createdItem.region,
      sshPort: createdItem.ssh_port,
      sshUsername: createdItem.ssh_username,
      sshPassword: createdItem.ssh_password,
      sshPrivateKey: createdItem.ssh_private_key,
      tags: createdItem.tags || [] // 确保 tags 是数组而不是 null
    };
  } catch (error) {
    console.error('Error creating config item:', error);
    throw error;
  }
};

// 更新配置项
export const updateConfigItem = async (id: string, item: Partial<ConfigurationItem>): Promise<ConfigurationItem> => {
  try {
    // 只发送蛇形字段，过滤 undefined
    const payload: Record<string, any> = {};
    if (item.name !== undefined) payload.name = item.name;
    if (item.type !== undefined) payload.type = item.type;
    if (item.status !== undefined) payload.status = item.status;
    if (item.environment !== undefined) payload.environment = item.environment;
    if (item.businessLine !== undefined) payload.business_line = item.businessLine;
    if (item.owner !== undefined) payload.owner = item.owner;
    if (item.tags !== undefined) payload.tags = item.tags;
    if (item.ip !== undefined) payload.ip = item.ip;
    if (item.hostname !== undefined) payload.hostname = item.hostname;
    if (item.os !== undefined) payload.os = item.os;
    if (item.cpu !== undefined) payload.cpu = item.cpu;
    if (item.memory !== undefined) payload.memory = item.memory;
    if (item.disk !== undefined) payload.disk = item.disk;
    if (item.sshPort !== undefined) payload.ssh_port = item.sshPort;
    if (item.sshUsername !== undefined) payload.ssh_username = item.sshUsername;
    if (item.sshPassword !== undefined) payload.ssh_password = item.sshPassword;
    if (item.sshPrivateKey !== undefined) payload.ssh_private_key = item.sshPrivateKey;
    if (item.deviceType !== undefined) payload.device_type = item.deviceType;
    if (item.location !== undefined) payload.location = item.location;
    if (item.version !== undefined) payload.version = item.version;
    if (item.deployPath !== undefined) payload.deploy_path = item.deployPath;
    if (item.middlewareType !== undefined) payload.middleware_type = item.middlewareType;
    if (item.middlewareCategory !== undefined) payload.middleware_category = item.middlewareCategory;
    if (item.port !== undefined) payload.port = item.port;
    if (item.username !== undefined) payload.username = item.username;
    if (item.dbType !== undefined) payload.db_type = item.dbType;
    if (item.databaseName !== undefined) payload.database_name = item.databaseName;
    if (item.instanceName !== undefined) payload.instance_name = item.instanceName;
    if (item.storageSize !== undefined) payload.storage_size = item.storageSize;
    if (item.backupPolicy !== undefined) payload.backup_policy = item.backupPolicy;
    if (item.connectionString !== undefined) payload.connection_string = item.connectionString;
    if (item.mqType !== undefined) payload.mq_type = item.mqType;
    if (item.queueName !== undefined) payload.queue_name = item.queueName;
    if (item.messageModel !== undefined) payload.message_model = item.messageModel;
    if (item.appServerType !== undefined) payload.app_server_type = item.appServerType;
    if (item.jvmParams !== undefined) payload.jvm_params = item.jvmParams;
    if (item.cloudProvider !== undefined) payload.cloud_provider = item.cloudProvider;
    if (item.region !== undefined) payload.region = item.region;

    const response = await apiClient.put(`/api/cmdb/config-items/${id}`, payload);
    const updatedItem = response.data;
    return {
      ...updatedItem,
      businessLine: updatedItem.business_line || '',
      createTime: updatedItem.create_time || new Date().toLocaleString('zh-CN'),
      updateTime: updatedItem.update_time ? new Date(updatedItem.update_time).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN'),
      deviceType: updatedItem.device_type,
      deployPath: updatedItem.deploy_path,
      middlewareType: updatedItem.middleware_type,
      middlewareCategory: updatedItem.middleware_category,
      databaseName: updatedItem.database_name,
      instanceName: updatedItem.instance_name,
      storageSize: updatedItem.storage_size,
      backupPolicy: updatedItem.backup_policy,
      connectionString: updatedItem.connection_string,
      mqType: updatedItem.mq_type,
      queueName: updatedItem.queue_name,
      messageModel: updatedItem.message_model,
      appServerType: updatedItem.app_server_type,
      jvmParams: updatedItem.jvm_params,
      cloudProvider: updatedItem.cloud_provider,
      region: updatedItem.region,
      sshPort: updatedItem.ssh_port,
      sshUsername: updatedItem.ssh_username,
      sshPassword: updatedItem.ssh_password,
      sshPrivateKey: updatedItem.ssh_private_key,
      tags: updatedItem.tags || [] // 确保 tags 是数组而不是 null
    };
  } catch (error) {
    console.error(`Error updating config item ${id}:`, error);
    throw error;
  }
};

// 删除配置项
export const deleteConfigItem = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/cmdb/config-items/${id}`);
  } catch (error) {
    console.error(`Error deleting config item ${id}:`, error);
    throw error;
  }
};

// 获取标签列表
export const getTags = async (): Promise<Tag[]> => {
  try {
    const response = await apiClient.get('/api/cmdb/tags');
    const data = response.data || [];
    if (!Array.isArray(data)) {
      return [];
    }
    return data;
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

// 创建标签
export const createTag = async (tag: Omit<Tag, 'id'> & { id: string }): Promise<Tag> => {
  try {
    const response = await apiClient.post('/api/cmdb/tags', tag);
    return response.data;
  } catch (error) {
    console.error('Error creating tag:', error);
    throw error;
  }
};

// 获取关系列表
export const getRelationships = async (): Promise<Relationship[]> => {
  try {
    const response = await apiClient.get('/api/cmdb/relationships');
    return response.data;
  } catch (error) {
    console.error('Error fetching relationships:', error);
    throw error;
  }
};

// 创建关系
export const createRelationship = async (relationship: Omit<Relationship, 'id'>): Promise<Relationship> => {
  try {
    const response = await apiClient.post('/api/cmdb/relationships', relationship);
    return response.data;
  } catch (error) {
    console.error('Error creating relationship:', error);
    throw error;
  }
};

// 删除关系
export const deleteRelationship = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/api/cmdb/relationships/${id}`);
  } catch (error) {
    console.error(`Error deleting relationship ${id}:`, error);
    throw error;
  }
};
