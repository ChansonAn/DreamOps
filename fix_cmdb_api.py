import re

# 读取文件
with open(r'I:\APP\dreamops\frontend\src\api\cmdb.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复 createConfigItem：只发送蛇形字段，不发送驼峰
old_create = '''export const createConfigItem = async (item: Omit<ConfigurationItem, 'id' | 'createTime' | 'updateTime'>): Promise<ConfigurationItem> => {
  try {
    // 过滤掉 undefined 字段
    const filteredItem = Object.fromEntries(
      Object.entries(item).filter(([_, v]) => v !== undefined)
    );
    const response = await apiClient.post('/api/cmdb/config-items', {
      ...filteredItem,
      business_line: item.businessLine,
      device_type: item.deviceType,
      deploy_path: item.deployPath,
      middleware_type: item.middlewareType,
      middleware_category: item.middlewareCategory,
      database_name: item.databaseName,
      instance_name: item.instanceName,
      storage_size: item.storageSize,
      backup_policy: item.backupPolicy,
      connection_string: item.connectionString,
      mq_type: item.mqType,
      queue_name: item.queueName,
      message_model: item.messageModel,
      app_server_type: item.appServerType,
      jvm_params: item.jvmParams,
      cloud_provider: item.cloudProvider,
      ssh_port: item.sshPort,
      ssh_username: item.sshUsername,
      ssh_password: item.sshPassword,
      ssh_private_key: item.sshPrivateKey
    });'''

new_create = '''export const createConfigItem = async (item: Omit<ConfigurationItem, 'id' | 'createTime' | 'updateTime'>): Promise<ConfigurationItem> => {
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
    const response = await apiClient.post('/api/cmdb/config-items', payload);'''

content = content.replace(old_create, new_create)

with open(r'I:\APP\dreamops\frontend\src\api\cmdb.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("createConfigItem fixed")
