"""
Job Template Schema
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class JobTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    script_ids: List[int] = []
    cron_expression: Optional[str] = None
    status: str = "enabled"


class JobTemplateCreate(JobTemplateBase):
    creator: str = "admin"


class JobTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    script_ids: Optional[List[int]] = None
    cron_expression: Optional[str] = None
    status: Optional[str] = None


class JobTemplate(JobTemplateBase):
    id: int
    creator: str
    create_time: Optional[datetime] = None
    
    class Config:
        from_attributes = True
