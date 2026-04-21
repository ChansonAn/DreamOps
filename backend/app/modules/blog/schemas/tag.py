from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# 标签基础模型
class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    slug: Optional[str] = Field(None, min_length=1, max_length=50)

# 创建标签模型
class TagCreate(TagBase):
    pass

# 更新标签模型
class TagUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    slug: Optional[str] = Field(None, min_length=1, max_length=50)

# 返回给客户端的标签模型
class Tag(TagBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
