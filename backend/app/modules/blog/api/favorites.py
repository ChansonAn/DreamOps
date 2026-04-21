from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.modules.blog.schemas.favorite import Favorite, FavoriteCreate
from app.modules.blog.crud.favorite import (
    get_favorite, get_favorites_by_user, create_favorite, delete_favorite, is_favorited_by_user
)
from app.modules.user.api.users import get_current_active_user
from app.modules.user.schemas.user import User

router = APIRouter()

# 获取用户的所有收藏
@router.get("/user", response_model=List[Favorite])
def read_favorites_by_user(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    favorites = get_favorites_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return favorites

# 检查用户是否已收藏文章
@router.get("/check/{article_id}", response_model=bool)
def check_favorite(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    favorited = is_favorited_by_user(db, user_id=current_user.id, article_id=article_id)
    return favorited

# 创建收藏
@router.post("/", response_model=Favorite, status_code=status.HTTP_201_CREATED)
def create_favorite_endpoint(
    favorite_in: FavoriteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        favorite = create_favorite(db=db, favorite_in=favorite_in, user_id=current_user.id)
        return favorite
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# 删除收藏
@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_favorite_endpoint(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    success = delete_favorite(db=db, user_id=current_user.id, article_id=article_id)
    if not success:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return None
