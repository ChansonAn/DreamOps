from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.modules.user.schemas.user import User
from app.modules.blog.schemas.category import Category
from app.modules.blog.schemas.tag import Tag

# 文章基础模型
class ArticleBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: Optional[str] = None
    excerpt: Optional[str] = Field(None, max_length=500, alias='summary')
    is_published: Optional[bool] = False
    category_id: Optional[int] = None
    cover_image: Optional[str] = None
    
    model_config = {"populate_by_name": True}

# 创建文章模型
class ArticleCreate(ArticleBase):
    slug: Optional[str] = None
    cover_image: Optional[str] = None
    tag_ids: Optional[List[int]] = None

# 更新文章模型
class ArticleUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = None
    excerpt: Optional[str] = Field(None, max_length=500)
    is_published: Optional[bool] = None
    category_id: Optional[int] = None
    cover_image: Optional[str] = None
    tag_ids: Optional[List[int]] = None

# 数据库中的文章模型
class ArticleInDB(ArticleBase):
    id: int
    view_count: int = 0
    like_count: int = 0
    comment_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    author_id: Optional[int] = None
    cover_image: Optional[str] = None
    
    class Config:
        from_attributes = True

# 返回给客户端的文章模型
class Article(ArticleBase):
    id: int
    view_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    author: Optional[dict] = None
    category: Optional[dict] = None
    cover_image: Optional[str] = None
    tags: List[Tag] = []
    
    class Config:
        from_attributes = True

# 分页响应模型
class ArticlePagination(BaseModel):
    total: int
    items: List[Article]
