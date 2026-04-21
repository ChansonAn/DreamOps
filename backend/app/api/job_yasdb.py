"""
Job API - YashanDB 版本
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.schemas.job import Job, JobCreate, JobUpdate
from app.crud.job_yasdb import (
    get_jobs,
    get_job,
    create_job,
    update_job,
    delete_job
)
from app.db.yasdb_pool import get_db
from app.utils.job_engine import run_job

router = APIRouter()


@router.get("/", response_model=List[Job])
async def read_jobs(skip: int = 0, limit: int = 100):
    """获取作业列表"""
    try:
        with get_db() as db:
            jobs_list = get_jobs(db, skip=skip, limit=limit)
            return jobs_list
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{job_id}", response_model=Job)
async def read_job(job_id: int):
    """获取单个作业"""
    with get_db() as db:
        job = get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="作业不存在")
    return job


@router.post("/", response_model=Job)
async def create_job_endpoint(job: JobCreate):
    """创建作业"""
    try:
        with get_db() as db:
            job_dict = job.model_dump()
            new_job = create_job(db, job_dict)
            return new_job
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{job_id}", response_model=Job)
async def update_job_endpoint(job_id: int, job: JobUpdate):
    """更新作业"""
    with get_db() as db:
        existing = get_job(db, job_id)
        if not existing:
            raise HTTPException(status_code=404, detail="作业不存在")
        try:
            job_dict = job.model_dump(exclude_unset=True)
            updated = update_job(db, job_id, job_dict)
            return updated
        except Exception as e:
            print(f"Error: {e}")
            raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{job_id}")
async def delete_job_endpoint(job_id: int):
    """删除作业"""
    with get_db() as db:
        existing = get_job(db, job_id)
        if not existing:
            raise HTTPException(status_code=404, detail="作业不存在")
        try:
            delete_job(db, job_id)
            return {"message": "删除成功"}
        except Exception as e:
            print(f"Error: {e}")
            raise HTTPException(status_code=500, detail=str(e))


@router.post("/{job_id}/execute")
async def execute_job_endpoint(
    job_id: int,
    target_host: Optional[str] = Query(None, description="目标主机IP，为空则在本地执行")
):
    """
    执行作业
    
    会根据作业关联的模板，依次执行模板中的所有脚本，
    并自动记录执行日志。
    """
    with get_db() as db:
        job = get_job(db, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="作业不存在")
    
    try:
        result = run_job(job_id=job_id, target_host=target_host, executor="admin")
        return result
    except Exception as e:
        print(f"Execute error: {e}")
        raise HTTPException(status_code=500, detail=f"执行失败: {str(e)}")


@router.get("/{job_id}/logs")
async def get_job_logs(job_id: int, skip: int = 0, limit: int = 100):
    """获取作业的执行日志"""
    with get_db() as db:
        db.execute(
            f"SELECT id, task_id, job_id, template_id, script_id, execution_type, name, status, "
            f"output, error, creator, start_time, end_time "
            f"FROM execution_logs WHERE job_id = {job_id} "
            f"ORDER BY id DESC OFFSET {skip} ROWS FETCH NEXT {limit} ROWS ONLY"
        )
        rows = db.fetchall_dicts()
        return [dict(row) for row in rows]
