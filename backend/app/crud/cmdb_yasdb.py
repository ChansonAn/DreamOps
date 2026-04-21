"""
CMDB CRUD - YashanDB 原生 SQL 版本
"""
from typing import List, Optional, Dict, Any
import json
from datetime import datetime


def get_config_items(db, skip: int = 0, limit: int = 100, types: Optional[List[str]] = None,
                    environment: Optional[str] = None, keyword: Optional[str] = None,
                    business_line: Optional[str] = None) -> List[Dict[str, Any]]:
    """获取配置项列表，支持多类型、环境、关键词过滤"""
    from app.db.yasdb_pool import query_all
    
    conditions = []
    params = {}
    if types:
        # 支持多类型过滤
        type_placeholders = []
        for i, t in enumerate(types):
            ph = f"type_{i}"
            type_placeholders.append(f":{ph}")
            params[ph] = t
        conditions.append(f"type IN ({', '.join(type_placeholders)})")
    if environment:
        conditions.append("environment = :env")
        params["env"] = environment
    if keyword:
        conditions.append("(name LIKE :kw OR ip LIKE :kw OR hostname LIKE :kw OR business_line LIKE :kw OR owner LIKE :kw OR tags LIKE :kw)")
        params["kw"] = f"%{keyword}%"
    if business_line:
        conditions.append("business_line = :bl")
        params["bl"] = business_line
    
    where_clause = (" WHERE " + " AND ".join(conditions)) if conditions else ""
    
    sql = f"""
        SELECT * FROM cmdb_config_items 
        {where_clause}
        ORDER BY id
        OFFSET {skip} ROWS FETCH NEXT {limit} ROWS ONLY
    """
    return query_all(sql, params if params else None) or []


def get_config_item(db, item_id: str) -> Optional[Dict[str, Any]]:
    """获取单个配置项"""
    from app.db.yasdb_pool import query_one
    return query_one("SELECT * FROM cmdb_config_items WHERE id = :id", {"id": item_id})


def get_host_by_ip(db, ip: str) -> Optional[Dict[str, Any]]:
    """通过IP获取主机配置项
    支持所有可能需要远程执行脚本的类型：
    - host: 主机
    - database: 数据库
    - application: 应用服务
    - middleware: 中间件
    - vm: 虚拟机
    - physical: 物理机
    - container: 容器化
    - cloud: 云资源
    - network: 网络设备
    - cabinet: 机柜
    - virtualization: 虚拟化平台
    """
    from app.db.yasdb_pool import query_one
    return query_one("""
        SELECT * FROM cmdb_config_items 
        WHERE ip = :ip AND type IN (
            'host', 'database', 'application', 'middleware', 
            'vm', 'physical', 'container', 'cloud', 'network',
            'cabinet', 'virtualization'
        )
    """, {"ip": ip})


def create_config_item(db, item_in) -> Dict[str, Any]:
    """创建配置项"""
    from app.db.yasdb_pool import execute_sql, query_one
    
    tags_json = json.dumps(item_in.tags) if hasattr(item_in, 'tags') and item_in.tags else None
    
    # 构建插入 SQL - 包含所有字段
    sql = """
        INSERT INTO cmdb_config_items (
            id, name, type, status, environment, business_line, owner,
            create_time, update_time, tags,
            ip, hostname, os, cpu, memory, disk, ssh_port,
            ssh_username, ssh_password, ssh_private_key,
            device_type, location, version, deploy_path,
            middleware_type, middleware_category, port, username,
            db_type, database_name, instance_name, storage_size,
            backup_policy, connection_string, mq_type, queue_name,
            message_model, app_server_type, jvm_params,
            cloud_provider, region
        ) VALUES (
            :id, :name, :type, :status, :environment, :business_line, :owner,
            SYSTIMESTAMP, SYSTIMESTAMP, :tags,
            :ip, :hostname, :os, :cpu, :memory, :disk, :ssh_port,
            :ssh_username, :ssh_password, :ssh_private_key,
            :device_type, :location, :version, :deploy_path,
            :middleware_type, :middleware_category, :port, :username,
            :db_type, :database_name, :instance_name, :storage_size,
            :backup_policy, :connection_string, :mq_type, :queue_name,
            :message_model, :app_server_type, :jvm_params,
            :cloud_provider, :region
        )
    """
    
    # Auto-generate id if None
    import time
    item_id = item_in.id
    if not item_id:
        item_id = f"new-{int(time.time() * 1000)}"
    
    params = {
        'id': item_id,
        'name': item_in.name,
        'type': item_in.type,
        'status': item_in.status,
        'environment': item_in.environment,
        'business_line': getattr(item_in, 'business_line', None),
        'owner': getattr(item_in, 'owner', None),
        'tags': tags_json,
        # 主机属性
        'ip': getattr(item_in, 'ip', None),
        'hostname': getattr(item_in, 'hostname', None),
        'os': getattr(item_in, 'os', None),
        'cpu': getattr(item_in, 'cpu', None),
        'memory': getattr(item_in, 'memory', None),
        'disk': getattr(item_in, 'disk', None),
        'ssh_port': getattr(item_in, 'ssh_port', None),
        'ssh_username': getattr(item_in, 'ssh_username', None),
        'ssh_password': getattr(item_in, 'ssh_password', None),
        'ssh_private_key': getattr(item_in, 'ssh_private_key', None),
        # 网络设备属性
        'device_type': getattr(item_in, 'device_type', None),
        'location': getattr(item_in, 'location', None),
        # 应用服务属性
        'version': getattr(item_in, 'version', None),
        'deploy_path': getattr(item_in, 'deploy_path', None),
        # 中间件属性
        'middleware_type': getattr(item_in, 'middleware_type', None),
        'middleware_category': getattr(item_in, 'middleware_category', None),
        'port': getattr(item_in, 'port', None),
        'username': getattr(item_in, 'username', None),
        # 数据库属性
        'db_type': getattr(item_in, 'db_type', None),
        'database_name': getattr(item_in, 'database_name', None),
        'instance_name': getattr(item_in, 'instance_name', None),
        'storage_size': getattr(item_in, 'storage_size', None),
        'backup_policy': getattr(item_in, 'backup_policy', None),
        'connection_string': getattr(item_in, 'connection_string', None),
        # 消息队列属性
        'mq_type': getattr(item_in, 'mq_type', None),
        'queue_name': getattr(item_in, 'queue_name', None),
        'message_model': getattr(item_in, 'message_model', None),
        # 应用服务器属性
        'app_server_type': getattr(item_in, 'app_server_type', None),
        'jvm_params': getattr(item_in, 'jvm_params', None),
        # 云资源属性
        'cloud_provider': getattr(item_in, 'cloud_provider', None),
        'region': getattr(item_in, 'region', None),
    }
    
    execute_sql(sql, params)
    return get_config_item(db, item_id)


def update_config_item(db, item_id: str, item_in) -> Optional[Dict[str, Any]]:
    """更新配置项"""
    from app.db.yasdb_pool import execute_sql
    
    db_item = get_config_item(db, item_id)
    if not db_item:
        return None
    
    update_data = item_in.dict(exclude_unset=True) if hasattr(item_in, 'dict') else dict(item_in)
    
    # 处理tags
    if 'tags' in update_data and update_data['tags']:
        update_data['tags'] = json.dumps(update_data['tags'])
    
    update_data['update_time'] = 'SYSTIMESTAMP'
    
    if update_data:
        set_clauses = []
        params = {'id': item_id}
        for field, value in update_data.items():
            if field == 'update_time':
                set_clauses.append("update_time = SYSTIMESTAMP")
            else:
                set_clauses.append(f"{field} = :{field}")
                params[field] = value
        
        sql = f"UPDATE cmdb_config_items SET {', '.join(set_clauses)} WHERE id = :id"
        execute_sql(sql, params)
    
    return get_config_item(db, item_id)


def delete_config_item(db, item_id: str) -> bool:
    """删除配置项"""
    from app.db.yasdb_pool import execute_sql
    
    item = get_config_item(db, item_id)
    if not item:
        return False
    
    # 删除关联的关系
    execute_sql("DELETE FROM cmdb_relationships WHERE source = :id OR target = :id", {"id": item_id})
    execute_sql("DELETE FROM cmdb_config_items WHERE id = :id", {"id": item_id})
    return True


# ========== 关系管理 ==========

def get_relationships(db, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """获取关系列表"""
    from app.db.yasdb_pool import query_all
    sql = f"SELECT * FROM cmdb_relationships ORDER BY id OFFSET {skip} ROWS FETCH NEXT {limit} ROWS ONLY"
    return query_all(sql) or []


def get_item_relationships(db, item_id: str) -> List[Dict[str, Any]]:
    """获取配置项的关系"""
    from app.db.yasdb_pool import query_all
    return query_all("""
        SELECT * FROM cmdb_relationships 
        WHERE source = :id OR target = :id
    """, {"id": item_id}) or []


def create_relationship(db, relationship_in) -> Dict[str, Any]:
    """创建关系"""
    from app.db.yasdb_pool import get_next_id, execute_sql, query_one
    
    new_id = get_next_id('cmdb_relationships')
    
    sql = """
        INSERT INTO cmdb_relationships (id, source, target, type)
        VALUES (:id, :source, :target, :type)
    """
    execute_sql(sql, {
        'id': new_id,
        'source': relationship_in.source,
        'target': relationship_in.target,
        'type': relationship_in.type
    })
    
    return query_one("SELECT * FROM cmdb_relationships WHERE id = :id", {"id": new_id})


def delete_relationship(db, relationship_id: int) -> bool:
    """删除关系"""
    from app.db.yasdb_pool import execute_sql, query_one
    
    result = query_one("SELECT id FROM cmdb_relationships WHERE id = :id", {"id": relationship_id})
    if not result:
        return False
    
    execute_sql("DELETE FROM cmdb_relationships WHERE id = :id", {"id": relationship_id})
    return True


# ========== CMDB 标签管理 ==========

def get_cmdb_tags(db, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """获取标签列表"""
    from app.db.yasdb_pool import query_all
    sql = f"SELECT * FROM cmdb_tags ORDER BY id OFFSET {skip} ROWS FETCH NEXT {limit} ROWS ONLY"
    return query_all(sql) or []


def get_cmdb_tag(db, tag_id: str) -> Optional[Dict[str, Any]]:
    """获取单个标签"""
    from app.db.yasdb_pool import query_one
    return query_one("SELECT * FROM cmdb_tags WHERE id = :id", {"id": tag_id})


def create_cmdb_tag(db, tag_in) -> Dict[str, Any]:
    """创建标签"""
    from app.db.yasdb_pool import execute_sql, query_one
    
    sql = """
        INSERT INTO cmdb_tags (id, name, color)
        VALUES (:id, :name, :color)
    """
    execute_sql(sql, {
        'id': tag_in.id,
        'name': tag_in.name,
        'color': tag_in.color
    })
    
    return get_cmdb_tag(db, tag_in.id)


def delete_cmdb_tag(db, tag_id: str) -> bool:
    """删除标签"""
    from app.db.yasdb_pool import execute_sql
    
    tag = get_cmdb_tag(db, tag_id)
    if not tag:
        return False
    
    execute_sql("DELETE FROM cmdb_tags WHERE id = :id", {"id": tag_id})
    return True
