from sqlalchemy.orm import Session
from typing import List, Optional
import json
from datetime import datetime
from app.models.cmdb import CMDBConfigItem, CMDBRelationship, CMDTag
from app.schemas.cmdb import CMDBConfigItemCreate, CMDBConfigItemUpdate, CMDBRelationshipCreate, CMDTagCreate

# 获取配置项列表
def get_config_items(db: Session, skip: int = 0, limit: int = 100, item_type: Optional[str] = None) -> List[CMDBConfigItem]:
    query = db.query(CMDBConfigItem)
    if item_type:
        query = query.filter(CMDBConfigItem.type == item_type)
    return query.offset(skip).limit(limit).all()

# 获取单个配置项
def get_config_item(db: Session, item_id: str) -> Optional[CMDBConfigItem]:
    return db.query(CMDBConfigItem).filter(CMDBConfigItem.id == item_id).first()

# 通过IP获取主机配置项
# 支持所有可能需要远程执行脚本的类型：
# - host: 主机
# - database: 数据库
# - application: 应用服务
# - middleware: 中间件
# - vm: 虚拟机
# - physical: 物理机
# - container: 容器化
# - cloud: 云资源
# - network: 网络设备
# - cabinet: 机柜
# - virtualization: 虚拟化平台
def get_host_by_ip(db: Session, ip: str) -> Optional[CMDBConfigItem]:
    return db.query(CMDBConfigItem).filter(
        CMDBConfigItem.ip == ip,
        CMDBConfigItem.type.in_([
            'host', 'database', 'application', 'middleware',
            'vm', 'physical', 'container', 'cloud', 'network',
            'cabinet', 'virtualization'
        ])
    ).first()

# 创建配置项
def create_config_item(db: Session, item_in: CMDBConfigItemCreate) -> CMDBConfigItem:
    # 将tags转换为JSON字符串
    tags_json = json.dumps(item_in.tags) if item_in.tags else None
    
    db_item = CMDBConfigItem(
        id=item_in.id,
        name=item_in.name,
        type=item_in.type,
        status=item_in.status,
        environment=item_in.environment,
        business_line=item_in.business_line,
        owner=item_in.owner,
        create_time=datetime.utcnow(),
        update_time=datetime.utcnow(),
        tags=tags_json,
        
        # 主机特有属性
        ip=item_in.ip,
        hostname=item_in.hostname,
        os=item_in.os,
        cpu=item_in.cpu,
        memory=item_in.memory,
        disk=item_in.disk,
        ssh_port=item_in.ssh_port,
        ssh_username=item_in.ssh_username,
        ssh_password=item_in.ssh_password,
        ssh_private_key=item_in.ssh_private_key,
        
        # 网络设备特有属性
        device_type=item_in.device_type,
        location=item_in.location,
        
        # 应用服务特有属性
        version=item_in.version,
        deploy_path=item_in.deploy_path,
        
        # 中间件特有属性
        middleware_type=item_in.middleware_type,
        middleware_category=item_in.middleware_category,
        port=item_in.port,
        username=item_in.username,
        
        # 数据库特有属性
        db_type=item_in.db_type,
        database_name=item_in.database_name,
        instance_name=item_in.instance_name,
        storage_size=item_in.storage_size,
        backup_policy=item_in.backup_policy,
        connection_string=item_in.connection_string,
        
        # 消息队列特有属性
        mq_type=item_in.mq_type,
        queue_name=item_in.queue_name,
        message_model=item_in.message_model,
        
        # 应用服务器特有属性
        app_server_type=item_in.app_server_type,
        jvm_params=item_in.jvm_params,
        
        # 云资源特有属性
        cloud_provider=item_in.cloud_provider,
        region=item_in.region
    )
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# 更新配置项
def update_config_item(db: Session, item_id: str, item_in: CMDBConfigItemUpdate) -> Optional[CMDBConfigItem]:
    db_item = get_config_item(db, item_id=item_id)
    if not db_item:
        return None
    
    # 更新字段
    update_data = item_in.dict(exclude_unset=True)
    
    # 处理tags
    if 'tags' in update_data:
        update_data['tags'] = json.dumps(update_data['tags'])
    
    # 更新时间
    update_data['update_time'] = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# 删除配置项
def delete_config_item(db: Session, item_id: str) -> bool:
    db_item = get_config_item(db, item_id=item_id)
    if not db_item:
        return False
    
    db.delete(db_item)
    db.commit()
    return True

# 获取关系列表
def get_relationships(db: Session, skip: int = 0, limit: int = 100) -> List[CMDBRelationship]:
    return db.query(CMDBRelationship).offset(skip).limit(limit).all()

# 获取配置项的关系
def get_item_relationships(db: Session, item_id: str) -> List[CMDBRelationship]:
    return db.query(CMDBRelationship).filter(
        (CMDBRelationship.source == item_id) | (CMDBRelationship.target == item_id)
    ).all()

# 创建关系
def create_relationship(db: Session, relationship_in: CMDBRelationshipCreate) -> CMDBRelationship:
    db_relationship = CMDBRelationship(
        source=relationship_in.source,
        target=relationship_in.target,
        type=relationship_in.type
    )
    
    db.add(db_relationship)
    db.commit()
    db.refresh(db_relationship)
    return db_relationship

# 删除关系
def delete_relationship(db: Session, relationship_id: int) -> bool:
    db_relationship = db.query(CMDBRelationship).filter(CMDBRelationship.id == relationship_id).first()
    if not db_relationship:
        return False
    
    db.delete(db_relationship)
    db.commit()
    return True

# 获取标签列表
def get_tags(db: Session, skip: int = 0, limit: int = 100) -> List[CMDTag]:
    return db.query(CMDTag).offset(skip).limit(limit).all()

# 获取单个标签
def get_tag(db: Session, tag_id: str) -> Optional[CMDTag]:
    return db.query(CMDTag).filter(CMDTag.id == tag_id).first()

# 创建标签
def create_tag(db: Session, tag_in: CMDTagCreate) -> CMDTag:
    db_tag = CMDTag(
        id=tag_in.id,
        name=tag_in.name,
        color=tag_in.color
    )
    
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag

# 删除标签
def delete_tag(db: Session, tag_id: str) -> bool:
    db_tag = get_tag(db, tag_id=tag_id)
    if not db_tag:
        return False
    
    db.delete(db_tag)
    db.commit()
    return True
