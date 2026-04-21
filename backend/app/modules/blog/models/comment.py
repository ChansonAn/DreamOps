from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 外键
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    
    # 关系（User 侧已移除 back_populates，此侧不再引用）
    article = relationship("Article", back_populates="comments")
    author = relationship("User")
    replies = relationship("Comment", backref="parent", remote_side=[id], cascade="all, delete-orphan", single_parent=True)
