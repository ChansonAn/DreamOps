from sqlalchemy.orm import Session
from typing import List, Optional
import json
from app.models.script import Script
from app.schemas.script import ScriptCreate, ScriptUpdate

# 获取脚本列表
def get_scripts(db: Session, skip: int = 0, limit: int = 100) -> List[Script]:
    return db.query(Script).offset(skip).limit(limit).all()

# 获取单个脚本
def get_script(db: Session, script_id: int) -> Optional[Script]:
    return db.query(Script).filter(Script.id == script_id).first()

# 根据名称获取脚本
def get_script_by_name(db: Session, name: str) -> Optional[Script]:
    return db.query(Script).filter(Script.name == name).first()

# 创建脚本
def create_script(db: Session, script_in: ScriptCreate) -> Script:
    # 将 tags 和 parameters 转换为 JSON 字符串
    tags_json = json.dumps(script_in.tags) if script_in.tags else None
    # 处理 parameters：可能是 Pydantic 模型对象列表或字典列表
    parameters_json = None
    if script_in.parameters:
        serialized_params = []
        for param in script_in.parameters:
            if hasattr(param, 'dict'):
                # Pydantic 模型对象
                serialized_params.append(param.dict())
            else:
                # 已经是字典
                serialized_params.append(param)
        parameters_json = json.dumps(serialized_params)
    
    db_script = Script(
        name=script_in.name,
        category=script_in.category,
        language=script_in.language,
        creator=script_in.creator,
        version=script_in.version,
        status=script_in.status,
        tags=tags_json,
        parameters=parameters_json,
        content=script_in.content,
        description=script_in.description
    )
    
    db.add(db_script)
    db.commit()
    db.refresh(db_script)
    return db_script

# 更新脚本
def update_script(db: Session, script_id: int, script_in: ScriptUpdate) -> Optional[Script]:
    db_script = get_script(db, script_id=script_id)
    if not db_script:
        return None
    
    # 更新字段
    update_data = script_in.dict(exclude_unset=True)
    
    # 处理 tags 和 parameters
    if 'tags' in update_data:
        update_data['tags'] = json.dumps(update_data['tags'])
    
    if 'parameters' in update_data:
        # 处理 parameters：可能是 Pydantic 模型对象列表或字典列表
        params_list = update_data['parameters']
        if params_list:
            serialized_params = []
            for param in params_list:
                if hasattr(param, 'dict'):
                    # Pydantic 模型对象
                    serialized_params.append(param.dict())
                else:
                    # 已经是字典
                    serialized_params.append(param)
            update_data['parameters'] = json.dumps(serialized_params)
        else:
            update_data['parameters'] = None
    
    for field, value in update_data.items():
        setattr(db_script, field, value)
    
    db.add(db_script)
    db.commit()
    db.refresh(db_script)
    return db_script

# 删除脚本
def delete_script(db: Session, script_id: int) -> bool:
    db_script = get_script(db, script_id=script_id)
    if not db_script:
        return False
    
    db.delete(db_script)
    db.commit()
    return True

# 更新脚本最后使用时间
def update_script_last_used(db: Session, script_id: int) -> Optional[Script]:
    db_script = get_script(db, script_id=script_id)
    if not db_script:
        return None
    
    from datetime import datetime
    db_script.last_used = datetime.utcnow()
    
    db.add(db_script)
    db.commit()
    db.refresh(db_script)
    return db_script
