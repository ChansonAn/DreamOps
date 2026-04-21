"""
Comments API - YashanDB 版本
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.db.yasdb_pool import get_db
from app.modules.blog.schemas.comment import Comment, CommentCreate, CommentUpdate
from app.modules.blog.crud.comment_yasdb import (
    get_comment, get_comments_by_article, create_comment, update_comment, delete_comment
)
from app.modules.user.api.users_yasdb import get_current_active_user

router = APIRouter()


@router.get("/article/{article_id}", response_model=List[Comment])
def read_comments_by_article(article_id: int, skip: int = 0, limit: int = 20):
    with get_db() as db:
        return get_comments_by_article(db, article_id=article_id, skip=skip, limit=limit)


@router.get("/{comment_id}", response_model=Comment)
def read_comment(comment_id: int):
    with get_db() as db:
        comment = get_comment(db, comment_id=comment_id)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        return comment


@router.post("/", response_model=Comment, status_code=status.HTTP_201_CREATED)
def create_comment_endpoint(comment_in: CommentCreate, current_user = Depends(get_current_active_user)):
    with get_db() as db:
        return create_comment(db=db, comment_in=comment_in, author_id=current_user['id'])


@router.put("/{comment_id}", response_model=Comment)
def update_comment_endpoint(comment_id: int, comment_in: CommentUpdate, current_user = Depends(get_current_active_user)):
    with get_db() as db:
        comment = get_comment(db, comment_id=comment_id)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        if comment['author_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        updated = update_comment(db=db, comment_id=comment_id, comment_in=comment_in)
        if not updated:
            raise HTTPException(status_code=404, detail="Comment not found")
        return updated


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment_endpoint(comment_id: int, current_user = Depends(get_current_active_user)):
    with get_db() as db:
        comment = get_comment(db, comment_id=comment_id)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        if comment['author_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        if not delete_comment(db=db, comment_id=comment_id):
            raise HTTPException(status_code=404, detail="Comment not found")
        return None
