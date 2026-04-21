"""
Script CRUD - YashanDB 原生 SQL 版本
"""
from typing import List, Optional, Dict, Any
import json
from datetime import datetime


def get_scripts(db, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """获取脚本列表"""
    from app.db.yasdb_pool import query_all
    sql = f"SELECT * FROM scripts ORDER BY id OFFSET {skip} ROWS FETCH NEXT {limit} ROWS ONLY"
    return query_all(sql) or []


def get_script(db, script_id: int) -> Optional[Dict[str, Any]]:
    """获取单个脚本"""
    from app.db.yasdb_pool import query_one
    return query_one("SELECT * FROM scripts WHERE id = :id", {"id": script_id})


def get_script_by_name(db, name: str) -> Optional[Dict[str, Any]]:
    """根据名称获取脚本"""
    from app.db.yasdb_pool import query_one
    return query_one("SELECT * FROM scripts WHERE name = :name", {"name": name})


def create_script(db, script_in) -> Dict[str, Any]:
    """创建脚本"""
    from app.db.yasdb_pool import get_next_id, execute_sql, query_one
    
    # 处理 tags
    tags_json = None
    if hasattr(script_in, 'tags') and script_in.tags:
        tags_json = json.dumps(script_in.tags)
    
    # 处理 parameters
    parameters_json = None
    if hasattr(script_in, 'parameters') and script_in.parameters:
        serialized_params = []
        for param in script_in.parameters:
            if hasattr(param, 'dict'):
                serialized_params.append(param.dict())
            else:
                serialized_params.append(param)
        parameters_json = json.dumps(serialized_params)
    
    new_id = get_next_id('scripts')
    
    sql = """
        INSERT INTO scripts (id, name, category, language, creator, create_time, 
            last_used, version, status, tags, parameters, content, description)
        VALUES (:id, :name, :category, :language, :creator, SYSTIMESTAMP,
            NULL, :version, :status, :tags, :parameters, :content, :description)
    """
    
    execute_sql(sql, {
        'id': new_id,
        'name': script_in.name,
        'category': script_in.category,
        'language': script_in.language,
        'creator': script_in.creator,
        'version': getattr(script_in, 'version', '1.0.0'),
        'status': getattr(script_in, 'status', '启用'),
        'tags': tags_json,
        'parameters': parameters_json,
        'content': script_in.content,
        'description': getattr(script_in, 'description', None)
    })
    
    return get_script(db, new_id)


def update_script(db, script_id: int, script_in) -> Optional[Dict[str, Any]]:
    """更新脚本"""
    from app.db.yasdb_pool import execute_sql
    
    db_script = get_script(db, script_id)
    if not db_script:
        return None
    
    update_data = script_in.dict(exclude_unset=True) if hasattr(script_in, 'dict') else dict(script_in)
    
    # 处理 tags
    if 'tags' in update_data and update_data['tags']:
        update_data['tags'] = json.dumps(update_data['tags'])
    
    # 处理 parameters
    if 'parameters' in update_data and update_data['parameters']:
        params_list = update_data['parameters']
        serialized_params = []
        for param in params_list:
            if hasattr(param, 'dict'):
                serialized_params.append(param.dict())
            else:
                serialized_params.append(param)
        update_data['parameters'] = json.dumps(serialized_params)
    
    if update_data:
        set_clauses = []
        params = {'id': script_id}
        for field, value in update_data.items():
            set_clauses.append(f"{field} = :{field}")
            params[field] = value
        
        sql = f"UPDATE scripts SET {', '.join(set_clauses)} WHERE id = :id"
        execute_sql(sql, params)
    
    return get_script(db, script_id)


def delete_script(db, script_id: int) -> bool:
    """删除脚本"""
    from app.db.yasdb_pool import execute_sql
    
    script = get_script(db, script_id)
    if not script:
        return False
    
    execute_sql("DELETE FROM scripts WHERE id = :id", {"id": script_id})
    return True


def update_script_last_used(db, script_id: int) -> Optional[Dict[str, Any]]:
    """更新脚本最后使用时间"""
    from app.db.yasdb_pool import execute_sql
    
    script = get_script(db, script_id)
    if not script:
        return None
    
    execute_sql("UPDATE scripts SET last_used = SYSTIMESTAMP WHERE id = :id", {"id": script_id})
    return get_script(db, script_id)
