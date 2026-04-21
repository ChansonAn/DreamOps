from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Like(Base):
    __tablename__ = "likes"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 外键
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    
    # 关系（User 侧已移除 back_populates，此侧不再引用）
    user = relationship("User")
    article = relationship("Article", back_populates="likes")
    
    # 唯一约束：一个用户只能点赞一篇文章一次
    __table_args__ = (UniqueConstraint('user_id', 'article_id', name='_user_article_like_uc'),)
