"""
Job Template API - YashanDB 版本
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.schemas.job_template import JobTemplate, JobTemplateCreate, JobTemplateUpdate
from app.crud.job_template_yasdb import (
    get_job_templates,
    get_job_template,
    create_job_template,
    update_job_template,
    delete_job_template
)
from app.crud.job_yasdb import create_job
from app.db.yasdb_pool import get_db

router = APIRouter()


# 获取作业模板列表
@router.get("/", response_model=List[JobTemplate])
async def read_job_templates(skip: int = 0, limit: int = 100):
    """获取作业模板列表"""
    try:
        with get_db() as db:
            templates = get_job_templates(db, skip=skip, limit=limit)
            return templates
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 获取单个作业模板
@router.get("/{template_id}", response_model=JobTemplate)
async def read_job_template(template_id: int):
    """获取单个作业模板"""
    with get_db() as db:
        template = get_job_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="作业模板不存在")
    return template


# 创建作业模板
@router.post("/", response_model=JobTemplate)
async def create_job_template_endpoint(template: JobTemplateCreate):
    """创建作业模板"""
    try:
        with get_db() as db:
            template_dict = template.model_dump()
            new_template = create_job_template(db, template_dict)
            return new_template
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 更新作业模板
@router.put("/{template_id}", response_model=JobTemplate)
async def update_job_template_endpoint(template_id: int, template: JobTemplateUpdate):
    """更新作业模板"""
    with get_db() as db:
        existing = get_job_template(db, template_id)
        if not existing:
            raise HTTPException(status_code=404, detail="作业模板不存在")
        
        try:
            template_dict = template.model_dump(exclude_unset=True)
            updated = update_job_template(db, template_id, template_dict)
            return updated
        except Exception as e:
            print(f"Error: {e}")
            raise HTTPException(status_code=500, detail=str(e))


# 删除作业模板
@router.delete("/{template_id}")
async def delete_job_template_endpoint(template_id: int):
    """删除作业模板"""
    with get_db() as db:
        existing = get_job_template(db, template_id)
        if not existing:
            raise HTTPException(status_code=404, detail="作业模板不存在")
        
        try:
            delete_job_template(db, template_id)
            return {"message": "删除成功"}
        except Exception as e:
            print(f"Error: {e}")
            raise HTTPException(status_code=500, detail=str(e))


@router.post("/{template_id}/create-job")
async def create_job_from_template(
    template_id: int,
    job_name: Optional[str] = None,
    job_type: str = "立即执行",
    cron_expression: Optional[str] = None,
    target_host: Optional[str] = None
):
    """
    从模板快速创建作业
    
    Args:
        job_type: 立即执行 / 定时执行
        target_host: 目标主机IP（执行时使用）
    """
    with get_db() as db:
        template = get_job_template(db, template_id)
        if not template:
            raise HTTPException(status_code=404, detail="作业模板不存在")
    
    template_name = template.get("name", f"模板_{template_id}")
    
    job_data = {
        "name": job_name or f"{template_name}作业",
        "template_id": template_id,
        "job_type": job_type,
        "cron_expression": cron_expression or template.get("cron_expression"),
        "status": "待执行",
        "creator": "admin"
    }
    
    try:
        with get_db() as db:
            job = create_job(db, job_data)
        
        return {
            "message": "作业创建成功",
            "template": template,
            "job": job
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建作业失败: {str(e)}")


@router.post("/{template_id}/execute")
async def execute_template_directly(
    template_id: int,
    target_host: Optional[str] = None
):
    """
    直接执行模板（不创建作业）
    
    流程：
    1. 创建临时作业
    2. 立即执行
    3. 返回执行结果
    """
    from app.utils.job_engine import run_job
    
    with get_db() as db:
        template = get_job_template(db, template_id)
        if not template:
            raise HTTPException(status_code=404, detail="作业模板不存在")
    
    template_name = template.get("name", f"模板_{template_id}")
    
    # 创建临时作业
    job_data = {
        "name": f"{template_name}临时执行",
        "template_id": template_id,
        "job_type": "立即执行",
        "cron_expression": template.get("cron_expression"),
        "status": "待执行",
        "creator": "admin"
    }
    
    try:
        with get_db() as db:
            job = create_job(db, job_data)
        
        # 立即执行
        result = run_job(job_id=job["id"], target_host=target_host, executor="admin")
        
        return {
            "message": "模板执行完成",
            "job": job,
            "execution_result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"执行失败: {str(e)}")
