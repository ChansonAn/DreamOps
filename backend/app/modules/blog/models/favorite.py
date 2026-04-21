from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Favorite(Base):
    __tablename__ = "favorites"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 外键
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    
    # 关系（User 侧已移除 back_populates，此侧不再引用）
    user = relationship("User")
    article = relationship("Article", back_populates="favorites")
    
    # 唯一约束：一个用户只能收藏一篇文章一次
    __table_args__ = (UniqueConstraint('user_id', 'article_id', name='_user_article_favorite_uc'),)
