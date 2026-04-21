from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas.script import Script, ScriptCreate, ScriptUpdate, ScriptRunResponse, ScriptRunRequest
from app.crud.script import (
    get_scripts,
    get_script,
    create_script,
    update_script,
    delete_script,
    update_script_last_used,
    get_script_by_name
)
from app.crud.cmdb import get_host_by_ip
from app.utils.script_executor import ScriptExecutor
from app.db.database import get_db
import json

router = APIRouter()


def _serialize_script(s) -> dict:
    """将 Script ORM 对象序列化为字典，处理 JSON 字符串字段和 None 时间."""
    tags = []
    if s.tags:
        try:
            tags = json.loads(s.tags)
        except (json.JSONDecodeError, TypeError):
            tags = []
    
    parameters = []
    if s.parameters:
        try:
            parameters = json.loads(s.parameters)
        except (json.JSONDecodeError, TypeError):
            parameters = []
    
    # create_time 允许为 None（子代理插入时漏设），传 None 让 Pydantic 处理
    from datetime import datetime
    create_time = s.create_time if s.create_time else None
    last_used = s.last_used
    
    return {
        "id": s.id,
        "name": s.name,
        "category": s.category,
        "language": s.language,
        "creator": s.creator,
        "version": s.version or "1.0.0",
        "status": s.status or "启用",
        "tags": tags,
        "parameters": parameters,
        "content": s.content,
        "description": s.description,
        "create_time": create_time,
        "last_used": last_used,
    }


# 获取脚本列表
@router.get("/", response_model=List[Script])
async def read_scripts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    scripts = get_scripts(db, skip=skip, limit=limit)
    return [Script.model_validate(_serialize_script(s)) for s in scripts]


# 获取单个脚本
@router.get("/{script_id}", response_model=Script)
async def read_script(
    script_id: int,
    db: Session = Depends(get_db)
):
    script = get_script(db, script_id=script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    return Script.model_validate(_serialize_script(script))


# 创建脚本
@router.post("/", response_model=Script)
async def create_new_script(
    script_in: ScriptCreate,
    db: Session = Depends(get_db)
):
    existing_script = get_script_by_name(db, name=script_in.name)
    if existing_script:
        raise HTTPException(status_code=400, detail="Script name already exists")
    
    script = create_script(db, script_in=script_in)
    return Script.model_validate(_serialize_script(script))


# 更新脚本
@router.put("/{script_id}", response_model=Script)
async def update_existing_script(
    script_id: int,
    script_in: ScriptUpdate,
    db: Session = Depends(get_db)
):
    script = update_script(db, script_id=script_id, script_in=script_in)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    return Script.model_validate(_serialize_script(script))

# 删除脚本
@router.delete("/{script_id}")
async def delete_existing_script(
    script_id: int,
    db: Session = Depends(get_db)
):
    success = delete_script(db, script_id=script_id)
    if not success:
        raise HTTPException(status_code=404, detail="Script not found")
    return {"message": "Script deleted successfully"}

# 运行脚本
@router.post("/{script_id}/run", response_model=ScriptRunResponse)
async def run_script(
    script_id: int,
    run_request: Optional[ScriptRunRequest] = None,
    db: Session = Depends(get_db)
):
    script = get_script(db, script_id=script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    
    # 更新脚本最后使用时间
    update_script_last_used(db, script_id=script_id)
    
    # 获取脚本内容和语言
    script_content = script.content or ""
    script_language = script.language or "Shell"
    
    # 获取脚本参数定义
    script_parameters = []
    if script.parameters:
        try:
            script_parameters = json.loads(script.parameters)
        except:
            script_parameters = []
    
    # 注入参数到脚本内容中
    if script_parameters and script_language.lower() == 'shell':
        # 为每个参数注入变量定义
        param_definitions = []
        for param in script_parameters:
            param_name = param.get('name', '')
            param_default = param.get('default', '')
            
            # 获取用户传入的参数值（如果有）
            user_value = None
            if run_request and run_request.parameters and param_name in run_request.parameters:
                user_value = run_request.parameters[param_name]
            
            # 使用用户传入的值或默认值
            value = user_value if user_value is not None else param_default
            
            # 将值转换为字符串
            if isinstance(value, bool):
                value_str = "true" if value else "false"
            elif value is None:
                value_str = ""
            else:
                value_str = str(value)
            
            # 添加参数定义（在脚本开头）
            param_definitions.append(f'{param_name}="{value_str}"')
        
        # 将参数定义注入到脚本开头
        if param_definitions:
            script_content = "\n".join(param_definitions) + "\n" + script_content
    
    # 如果没有指定主机，在本地执行（用于测试）
    if not run_request or not run_request.host:
        try:
            success, output, execution_time = ScriptExecutor.execute_script_local(
                script_content,
                script_language
            )
            
            return ScriptRunResponse(
                status="success" if success else "error",
                output=output,
                error=None if success else output,
                execution_time=execution_time
            )
        except Exception as e:
            return ScriptRunResponse(
                status="error",
                error=str(e),
                execution_time=0
            )
    
    # 通过SSH在远程主机执行
    host_ip = run_request.host
    
    # 从CMDB获取主机信息
    host_item = get_host_by_ip(db, ip=host_ip)
    
    if not host_item:
        return ScriptRunResponse(
            status="error",
            error=f"无法找到IP为 {host_ip} 的主机信息",
            execution_time=0
        )
    
    # 获取SSH连接信息
    ssh_port = host_item.ssh_port or 22
    ssh_username = host_item.ssh_username
    ssh_password = host_item.ssh_password
    ssh_private_key = host_item.ssh_private_key
    
    # 检查是否有SSH认证信息
    if not ssh_username:
        return ScriptRunResponse(
            status="error",
            error="主机没有配置SSH用户名",
            execution_time=0
        )
    
    try:
        # 执行脚本
        success, output, execution_time = ScriptExecutor.execute_script_ssh(
            host=host_ip,
            script_content=script_content,
            script_language=script_language,
            ssh_port=ssh_port,
            ssh_username=ssh_username,
            ssh_password=ssh_password,
            ssh_private_key=ssh_private_key
        )
        
        return ScriptRunResponse(
            status="success" if success else "error",
            output=output if success else None,
            error=None if success else output,
            execution_time=execution_time
        )
        
    except Exception as e:
        return ScriptRunResponse(
            status="error",
            error=f"脚本执行失败: {str(e)}",
            execution_time=0
        )
