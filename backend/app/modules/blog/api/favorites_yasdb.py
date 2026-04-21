"""
Favorites API - YashanDB 版本
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.db.yasdb_pool import get_db
from app.modules.blog.schemas.favorite import Favorite, FavoriteCreate
from app.modules.blog.crud.favorite_yasdb import (
    get_favorites_by_user, create_favorite, delete_favorite, is_favorited_by_user
)
from app.modules.user.api.users_yasdb import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[Favorite])
def read_favorites(skip: int = 0, limit: int = 10, current_user = Depends(get_current_active_user)):
    with get_db() as db:
        return get_favorites_by_user(db, user_id=current_user['id'], skip=skip, limit=limit)


@router.get("/check/{article_id}")
def check_favorited(article_id: int, current_user = Depends(get_current_active_user)):
    with get_db() as db:
        favorited = is_favorited_by_user(db, user_id=current_user['id'], article_id=article_id)
        return {"article_id": article_id, "favorited": favorited}


@router.post("/", response_model=Favorite, status_code=status.HTTP_201_CREATED)
def create_favorite_endpoint(favorite_in: FavoriteCreate, current_user = Depends(get_current_active_user)):
    with get_db() as db:
        try:
            return create_favorite(db=db, favorite_in=favorite_in, user_id=current_user['id'])
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_favorite_endpoint(article_id: int, current_user = Depends(get_current_active_user)):
    with get_db() as db:
        if not delete_favorite(db=db, user_id=current_user['id'], article_id=article_id):
            raise HTTPException(status_code=404, detail="Favorite not found")
        return None
