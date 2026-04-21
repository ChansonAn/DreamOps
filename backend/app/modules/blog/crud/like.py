from sqlalchemy.orm import Session
from typing import List, Optional
from app.modules.blog.models.like import Like
from app.modules.blog.schemas.like import LikeCreate

# 通过ID获取点赞
def get_like(db: Session, like_id: int) -> Optional[Like]:
    return db.query(Like).filter(Like.id == like_id).first()

# 检查用户是否已点赞文章
def is_liked_by_user(db: Session, user_id: int, article_id: int) -> bool:
    return db.query(Like).filter(
        Like.user_id == user_id,
        Like.article_id == article_id
    ).first() is not None

# 获取用户的所有点赞
def get_likes_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 10) -> List[Like]:
    return db.query(Like).filter(Like.user_id == user_id).order_by(Like.created_at.desc()).offset(skip).limit(limit).all()

# 获取文章的所有点赞
def get_likes_by_article(db: Session, article_id: int, skip: int = 0, limit: int = 10) -> List[Like]:
    return db.query(Like).filter(Like.article_id == article_id).order_by(Like.created_at.desc()).offset(skip).limit(limit).all()

# 创建点赞
def create_like(db: Session, like_in: LikeCreate, user_id: int) -> Like:
    existing_like = db.query(Like).filter(
        Like.user_id == user_id,
        Like.article_id == like_in.article_id
    ).first()
    
    if existing_like:
        raise ValueError("Already liked this article")
    
    db_like = Like(
        user_id=user_id,
        article_id=like_in.article_id
    )
    
    db.add(db_like)
    db.commit()
    db.refresh(db_like)
    return db_like

# 删除点赞
def delete_like(db: Session, user_id: int, article_id: int) -> bool:
    db_like = db.query(Like).filter(
        Like.user_id == user_id,
        Like.article_id == article_id
    ).first()
    
    if not db_like:
        return False
    
    db.delete(db_like)
    db.commit()
    return True
