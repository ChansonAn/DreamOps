from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Any

class ScriptParameter(BaseModel):
    name: str
    type: str
    required: bool
    default: Any
    description: str

class ScriptBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    language: str = Field(..., min_length=1, max_length=50)
    creator: str = Field(..., min_length=1, max_length=100)
    version: str = Field(default="1.0.0", max_length=50)
    status: str = Field(default="启用", max_length=20)
    tags: Optional[List[str]] = Field(default_factory=list)
    parameters: Optional[List[ScriptParameter]] = Field(default_factory=list)
    content: Optional[str] = None
    description: Optional[str] = None

class ScriptCreate(ScriptBase):
    pass

class ScriptUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    language: Optional[str] = Field(None, min_length=1, max_length=50)
    creator: Optional[str] = Field(None, min_length=1, max_length=100)
    version: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=20)
    tags: Optional[List[str]] = None
    parameters: Optional[List[ScriptParameter]] = None
    content: Optional[str] = None
    description: Optional[str] = None

class Script(ScriptBase):
    id: int
    create_time: Optional[datetime] = None
    last_used: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ScriptRunRequest(BaseModel):
    parameters: Optional[dict] = Field(default_factory=dict)
    host: Optional[str] = None

class ScriptRunResponse(BaseModel):
    status: str
    output: Optional[str] = None
    error: Optional[str] = None
    execution_time: Optional[float] = None