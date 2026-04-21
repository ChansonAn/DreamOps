from sqlalchemy import Column, Integer, ForeignKey
from app.db.database import Base

class ArticleTag(Base):
    __tablename__ = "article_tags"
    
    article_id = Column(Integer, ForeignKey("articles.id"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)
