"""
Script API - YashanDB 版本
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.schemas.script import Script, ScriptCreate, ScriptUpdate, ScriptRunResponse, ScriptRunRequest
from app.crud.script_yasdb import (
    get_scripts,
    get_script,
    create_script,
    update_script,
    delete_script,
    update_script_last_used,
    get_script_by_name
)
from app.crud.cmdb_yasdb import get_host_by_ip
from app.crud.job_template_yasdb import create_job_template
from app.crud.job_yasdb import create_job
from app.utils.script_executor import ScriptExecutor
from app.utils.job_engine import run_script
from app.db.yasdb_pool import get_db
import json

router = APIRouter()


def _serialize_script(s: dict) -> dict:
    """将脚本字典序列化，处理 JSON 字符串字段"""
    tags = []
    if s.get('tags'):
        try:
            tags = json.loads(s['tags']) if isinstance(s['tags'], str) else s['tags']
        except (json.JSONDecodeError, TypeError):
            tags = []
    
    parameters = []
    if s.get('parameters'):
        try:
            parameters = json.loads(s['parameters']) if isinstance(s['parameters'], str) else s['parameters']
        except (json.JSONDecodeError, TypeError):
            parameters = []
    
    return {
        "id": s.get('id'),
        "name": s.get('name'),
        "category": s.get('category'),
        "language": s.get('language'),
        "creator": s.get('creator'),
        "version": s.get('version') or "1.0.0",
        "status": s.get('status') or "启用",
        "tags": tags,
        "parameters": parameters,
        "content": s.get('content'),
        "description": s.get('description'),
        "create_time": s.get('create_time'),
        "last_used": s.get('last_used'),
    }


# 获取脚本列表
@router.get("/", response_model=List[Script])
async def read_scripts(
    skip: int = 0,
    limit: int = 100,
    db = Depends(get_db)
):
    scripts = get_scripts(db, skip=skip, limit=limit)
    return [Script.model_validate(_serialize_script(s)) for s in scripts]


# 获取单个脚本
@router.get("/{script_id}", response_model=Script)
async def read_script(
    script_id: int,
    db = Depends(get_db)
):
    script = get_script(db, script_id=script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    return Script.model_validate(_serialize_script(script))


# 创建脚本
@router.post("/", response_model=Script)
async def create_new_script(
    script_in: ScriptCreate,
    db = Depends(get_db)
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
    db = Depends(get_db)
):
    script = update_script(db, script_id=script_id, script_in=script_in)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    return Script.model_validate(_serialize_script(script))


# 删除脚本
@router.delete("/{script_id}")
async def delete_existing_script(
    script_id: int,
    db = Depends(get_db)
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
    db = Depends(get_db)
):
    script = get_script(db, script_id=script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    
    # 更新脚本最后使用时间
    update_script_last_used(db, script_id=script_id)
    
    # 获取脚本内容和语言
    script_content = script.get('content') or ""
    script_language = script.get('language') or "Shell"
    
    # 获取脚本参数定义
    script_parameters = []
    if script.get('parameters'):
        try:
            script_parameters = json.loads(script['parameters']) if isinstance(script['parameters'], str) else script['parameters']
        except:
            script_parameters = []
    
    # 注入参数到脚本内容中
    if script_parameters and script_language.lower() == 'shell':
        param_definitions = []
        for param in script_parameters:
            param_name = param.get('name', '')
            param_default = param.get('default', '')
            
            user_value = None
            if run_request and run_request.parameters and param_name in run_request.parameters:
                user_value = run_request.parameters[param_name]
            
            value = user_value if user_value is not None else param_default
            
            if isinstance(value, bool):
                value_str = "true" if value else "false"
            elif value is None:
                value_str = ""
            else:
                value_str = str(value)
            
            param_definitions.append(f'{param_name}="{value_str}"')
        
        if param_definitions:
            script_content = "\n".join(param_definitions) + "\n" + script_content
    
    # 如果没有指定主机，在本地执行
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
    ssh_port = host_item.get('ssh_port') or 22
    ssh_username = host_item.get('ssh_username')
    ssh_password = host_item.get('ssh_password')
    ssh_private_key = host_item.get('ssh_private_key')
    
    if not ssh_username:
        return ScriptRunResponse(
            status="error",
            error="主机没有配置SSH用户名",
            execution_time=0
        )
    
    try:
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


# ========== 脚本联动功能 ==========

@router.post("/{script_id}/execute-and-log")
async def execute_script_with_log(
    script_id: int,
    target_host: Optional[str] = None,
    parameters: Optional[dict] = None
):
    """
    执行脚本并记录日志
    
    与 /run 的区别：此接口会写入 execution_logs 表，
    可在执行日志页面查看记录。
    """
    result = run_script(
        script_id=script_id,
        target_host=target_host,
        parameters=parameters,
        executor="admin"
    )
    return result


@router.post("/{script_id}/create-template")
async def create_template_from_script(
    script_id: int,
    template_name: Optional[str] = None,
    description: Optional[str] = None,
    cron_expression: Optional[str] = None
):
    """
    从脚本快速创建作业模板
    
    自动将当前脚本加入模板的 script_ids 列表
    """
    with get_db() as db:
        script = get_script(db, script_id=script_id)
        if not script:
            raise HTTPException(status_code=404, detail="Script not found")
        
        script_name = script.get("name", f"脚本_{script_id}")
        
        template_data = {
            "name": template_name or f"{script_name}模板",
            "description": description or f"从脚本 '{script_name}' 自动创建的模板",
            "script_ids": [script_id],
            "cron_expression": cron_expression,
            "status": "enabled",
            "creator": "admin"
        }
        
        try:
            new_template = create_job_template(db, template_data)
            return {
                "message": "模板创建成功",
                "template": new_template
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"创建模板失败: {str(e)}")


@router.post("/{script_id}/create-job")
async def create_job_from_script(
    script_id: int,
    job_name: Optional[str] = None,
    job_type: str = "立即执行",
    cron_expression: Optional[str] = None,
    target_host: Optional[str] = None
):
    """
    从脚本快速创建作业
    
    流程：
    1. 自动创建一个包含该脚本的模板
    2. 基于模板创建作业
    3. 如果 job_type=立即执行，可选立即运行
    """
    with get_db() as db:
        script = get_script(db, script_id=script_id)
        if not script:
            raise HTTPException(status_code=404, detail="Script not found")
        
        script_name = script.get("name", f"脚本_{script_id}")
        
        # 1. 创建模板
        template_data = {
            "name": f"{script_name}临时模板",
            "description": f"从脚本 '{script_name}' 自动创建的临时模板",
            "script_ids": [script_id],
            "cron_expression": cron_expression,
            "status": "enabled",
            "creator": "admin"
        }
        
        try:
            template = create_job_template(db, template_data)
            template_id = template["id"]
            
            # 2. 创建作业
            job_data = {
                "name": job_name or f"{script_name}作业",
                "template_id": template_id,
                "job_type": job_type,
                "cron_expression": cron_expression,
                "status": "待执行",
                "creator": "admin"
            }
            
            job = create_job(db, job_data)
            
            return {
                "message": "作业创建成功",
                "template": template,
                "job": job
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"创建作业失败: {str(e)}")
