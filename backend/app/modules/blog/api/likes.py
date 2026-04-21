from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.modules.blog.schemas.like import Like, LikeCreate
from app.modules.blog.crud.like import (
    get_like, get_likes_by_user, get_likes_by_article, create_like, delete_like, is_liked_by_user
)
from app.modules.user.api.users import get_current_active_user
from app.modules.user.schemas.user import User

router = APIRouter()

# 获取用户的所有点赞
@router.get("/user", response_model=List[Like])
def read_likes_by_user(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    likes = get_likes_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return likes

# 获取文章的所有点赞
@router.get("/article/{article_id}", response_model=List[Like])
def read_likes_by_article(article_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    likes = get_likes_by_article(db, article_id=article_id, skip=skip, limit=limit)
    return likes

# 检查用户是否已点赞文章
@router.get("/check/{article_id}", response_model=bool)
def check_like(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    liked = is_liked_by_user(db, user_id=current_user.id, article_id=article_id)
    return liked

# 创建点赞
@router.post("/", response_model=Like, status_code=status.HTTP_201_CREATED)
def create_like_endpoint(
    like_in: LikeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        like = create_like(db=db, like_in=like_in, user_id=current_user.id)
        return like
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# 删除点赞
@router.delete("/article/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_like_endpoint(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    success = delete_like(db=db, user_id=current_user.id, article_id=article_id)
    if not success:
        raise HTTPException(status_code=404, detail="Like not found")
    return None
