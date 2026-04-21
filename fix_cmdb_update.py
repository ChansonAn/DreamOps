import re

# 读取文件
with open(r'I:\APP\dreamops\frontend\src\api\cmdb.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复 updateConfigItem：只发送蛇形字段
old_update = '''export const updateConfigItem = async (id: string, item: Partial<ConfigurationItem>): Promise<ConfigurationItem> => {
  try {
    // 过滤掉 undefined 字段，避免覆盖已有数据
    const filteredItem = Object.fromEntries(
      Object.entries(item).filter(([_, v]) => v !== undefined)
    );
    const response = await apiClient.put(`/api/cmdb/config-items/${id}`, {
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

new_update = '''export const updateConfigItem = async (id: string, item: Partial<ConfigurationItem>): Promise<ConfigurationItem> => {
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

    const response = await apiClient.put(`/api/cmdb/config-items/${id}`, payload);'''

content = content.replace(old_update, new_update)

with open(r'I:\APP\dreamops\frontend\src\api\cmdb.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("updateConfigItem fixed")
