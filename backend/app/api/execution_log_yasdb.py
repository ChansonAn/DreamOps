"""
Execution Log API - YashanDB 版本
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.schemas.execution_log import ExecutionLog, ExecutionLogCreate
from app.crud.execution_log_yasdb import (
    get_execution_logs,
    get_execution_log,
    create_execution_log,
    update_execution_log,
    delete_execution_log
)
from app.db.yasdb_pool import get_db

router = APIRouter()


@router.get("/", response_model=List[ExecutionLog])
async def read_execution_logs(
    skip: int = 0, 
    limit: int = 100, 
    execution_type: Optional[str] = Query(None, description="过滤类型: script/template/job")
):
    """获取执行日志列表"""
    try:
        with get_db() as db:
            logs = get_execution_logs(db, skip=skip, limit=limit, execution_type=execution_type)
            return logs
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{log_id}", response_model=ExecutionLog)
async def read_execution_log(log_id: int):
    """获取单个执行日志"""
    with get_db() as db:
        log = get_execution_log(db, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="执行日志不存在")
    return log


@router.post("/", response_model=ExecutionLog)
async def create_execution_log_endpoint(log: ExecutionLogCreate):
    """创建执行日志"""
    try:
        with get_db() as db:
            log_dict = log.model_dump()
            new_log = create_execution_log(db, log_dict)
            return new_log
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{log_id}/complete", response_model=ExecutionLog)
async def complete_execution_log(
    log_id: int, 
    status: str = "成功", 
    output: str = None, 
    error: str = None
):
    """完成执行日志"""
    with get_db() as db:
        existing = get_execution_log(db, log_id)
        if not existing:
            raise HTTPException(status_code=404, detail="执行日志不存在")
        try:
            update_dict = {"status": status}
            if output:
                update_dict["output"] = output
            if error:
                update_dict["error"] = error
            updated = update_execution_log(db, log_id, update_dict)
            return updated
        except Exception as e:
            print(f"Error: {e}")
            raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{log_id}")
async def delete_execution_log_endpoint(log_id: int):
    """删除执行日志"""
    with get_db() as db:
        existing = get_execution_log(db, log_id)
        if not existing:
            raise HTTPException(status_code=404, detail="执行日志不存在")
        try:
            delete_execution_log(db, log_id)
            return {"message": "删除成功"}
        except Exception as e:
            print(f"Error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
