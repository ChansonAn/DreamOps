from pydantic import BaseModel
from datetime import datetime
from app.modules.user.schemas.user import User
from app.modules.blog.schemas.article import Article

# 点赞基础模型
class LikeBase(BaseModel):
    article_id: int

# 创建点赞模型
class LikeCreate(LikeBase):
    pass

# 返回给客户端的点赞模型
class Like(LikeBase):
    id: int
    created_at: datetime
    user: User
    article: Article
    
    class Config:
        from_attributes = True
