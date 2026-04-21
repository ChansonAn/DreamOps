from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# 分类基础模型
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=255)

# 创建分类模型
class CategoryCreate(CategoryBase):
    pass

# 更新分类模型
class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=255)

# 返回给客户端的分类模型
class Category(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
