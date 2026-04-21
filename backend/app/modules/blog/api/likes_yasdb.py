"""
Likes API - YashanDB 版本
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.db.yasdb_pool import get_db
from app.modules.blog.schemas.like import Like, LikeCreate
from app.modules.blog.crud.like_yasdb import (
    get_likes_by_article, get_likes_by_user, create_like, delete_like,
    is_liked_by_user, get_like_count_by_article
)
from app.modules.user.api.users_yasdb import get_current_active_user

router = APIRouter()


@router.get("/article/{article_id}", response_model=List[Like])
def read_likes_by_article(article_id: int, skip: int = 0, limit: int = 10):
    with get_db() as db:
        return get_likes_by_article(db, article_id=article_id, skip=skip, limit=limit)


@router.get("/article/{article_id}/count")
def read_like_count(article_id: int):
    with get_db() as db:
        count = get_like_count_by_article(db, article_id=article_id)
        return {"article_id": article_id, "count": count}


@router.get("/user/{user_id}", response_model=List[Like])
def read_likes_by_user(user_id: int, skip: int = 0, limit: int = 10):
    with get_db() as db:
        return get_likes_by_user(db, user_id=user_id, skip=skip, limit=limit)


@router.get("/check/{article_id}")
def check_liked(article_id: int, current_user = Depends(get_current_active_user)):
    with get_db() as db:
        liked = is_liked_by_user(db, user_id=current_user['id'], article_id=article_id)
        return {"article_id": article_id, "liked": liked}


@router.post("/", response_model=Like, status_code=status.HTTP_201_CREATED)
def create_like_endpoint(like_in: LikeCreate, current_user = Depends(get_current_active_user)):
    with get_db() as db:
        try:
            return create_like(db=db, like_in=like_in, user_id=current_user['id'])
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_like_endpoint(article_id: int, current_user = Depends(get_current_active_user)):
    with get_db() as db:
        if not delete_like(db=db, user_id=current_user['id'], article_id=article_id):
            raise HTTPException(status_code=404, detail="Like not found")
        return None
