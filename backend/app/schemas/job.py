"""
Job Schema
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class JobBase(BaseModel):
    name: str
    template_id: int
    job_type: str = "立即执行"  # 立即执行/定时执行
    cron_expression: Optional[str] = None
    status: str = "待执行"


class JobCreate(JobBase):
    creator: str = "admin"


class JobUpdate(BaseModel):
    name: Optional[str] = None
    template_id: Optional[int] = None
    job_type: Optional[str] = None
    cron_expression: Optional[str] = None
    status: Optional[str] = None


class Job(JobBase):
    id: int
    template_name: Optional[str] = None
    creator: str
    create_time: Optional[datetime] = None
    last_execution: Optional[datetime] = None
    next_execution: Optional[datetime] = None
    
    class Config:
        from_attributes = True
