from sqlalchemy.orm import Session
from typing import List, Optional
from app.modules.blog.models.favorite import Favorite
from app.modules.blog.schemas.favorite import FavoriteCreate

# 通过ID获取收藏
def get_favorite(db: Session, favorite_id: int) -> Optional[Favorite]:
    return db.query(Favorite).filter(Favorite.id == favorite_id).first()

# 检查用户是否已收藏文章
def is_favorited_by_user(db: Session, user_id: int, article_id: int) -> bool:
    return db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.article_id == article_id
    ).first() is not None

# 获取用户的所有收藏
def get_favorites_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 10) -> List[Favorite]:
    return db.query(Favorite).filter(Favorite.user_id == user_id).order_by(Favorite.created_at.desc()).offset(skip).limit(limit).all()

# 创建收藏
def create_favorite(db: Session, favorite_in: FavoriteCreate, user_id: int) -> Favorite:
    existing_favorite = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.article_id == favorite_in.article_id
    ).first()
    
    if existing_favorite:
        raise ValueError("Already favorited this article")
    
    db_favorite = Favorite(
        user_id=user_id,
        article_id=favorite_in.article_id
    )
    
    db.add(db_favorite)
    db.commit()
    db.refresh(db_favorite)
    return db_favorite

# 删除收藏
def delete_favorite(db: Session, user_id: int, article_id: int) -> bool:
    db_favorite = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.article_id == article_id
    ).first()
    
    if not db_favorite:
        return False
    
    db.delete(db_favorite)
    db.commit()
    return True
