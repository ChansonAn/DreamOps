"""
Execution Log Schema
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ExecutionLogBase(BaseModel):
    job_id: Optional[int] = None
    template_id: Optional[int] = None
    script_id: Optional[int] = None
    execution_type: str  # script / job
    name: str
    status: str = "running"  # running / success / failed
    output: Optional[str] = None
    error: Optional[str] = None


class ExecutionLogCreate(ExecutionLogBase):
    creator: str = "admin"


class ExecutionLog(ExecutionLogBase):
    id: int
    task_id: int       # 全局执行任务ID（Task-XXXXXXXXXX）
    creator: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

    class Config:
        from_attributes = True
