from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Article(Base):
    __tablename__ = "articles"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), index=True, nullable=False)
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    is_published = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    cover_image = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 外键
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    
    # 关系（User 侧已移除 back_populates，此侧不再引用）
    author = relationship("User")
    category = relationship("Category", back_populates="articles")
    comments = relationship("Comment", back_populates="article", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="article", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="article", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary="article_tags", back_populates="articles")
