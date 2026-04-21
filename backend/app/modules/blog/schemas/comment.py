from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.modules.user.schemas.user import User

# 评论基础模型
class CommentBase(BaseModel):
    content: str = Field(..., min_length=1)
    parent_id: Optional[int] = None

# 创建评论模型
class CommentCreate(CommentBase):
    article_id: int

# 更新评论模型
class CommentUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1)
    is_approved: Optional[bool] = None

# 返回给客户端的评论模型
class Comment(CommentBase):
    id: int
    is_approved: bool
    created_at: datetime
    updated_at: datetime
    article_id: int
    author: User
    replies: List['Comment'] = []
    
    class Config:
        from_attributes = True

# 递归更新模型引用
Comment.model_rebuild()
