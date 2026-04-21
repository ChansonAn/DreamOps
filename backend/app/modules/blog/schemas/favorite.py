from pydantic import BaseModel
from datetime import datetime
from app.modules.user.schemas.user import User
from app.modules.blog.schemas.article import Article

# 收藏基础模型
class FavoriteBase(BaseModel):
    article_id: int

# 创建收藏模型
class FavoriteCreate(FavoriteBase):
    pass

# 返回给客户端的收藏模型
class Favorite(FavoriteBase):
    id: int
    created_at: datetime
    user: User
    article: Article
    
    class Config:
        from_attributes = True
