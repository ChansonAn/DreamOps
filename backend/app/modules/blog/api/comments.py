from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.modules.blog.schemas.comment import Comment, CommentCreate, CommentUpdate
from app.modules.blog.crud.comment import (
    get_comment, get_comments_by_article, create_comment, update_comment, delete_comment
)
from app.modules.user.api.users import get_current_active_user
from app.modules.user.schemas.user import User

router = APIRouter()

# 获取指定文章的所有评论
@router.get("/article/{article_id}", response_model=List[Comment])
def read_comments_by_article(article_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    comments = get_comments_by_article(db, article_id=article_id, skip=skip, limit=limit)
    return comments

# 获取指定评论
@router.get("/{comment_id}", response_model=Comment)
def read_comment(comment_id: int, db: Session = Depends(get_db)):
    comment = get_comment(db, comment_id=comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment

# 创建评论
@router.post("/", response_model=Comment, status_code=status.HTTP_201_CREATED)
def create_comment_endpoint(
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        comment = create_comment(db=db, comment_in=comment_in, author_id=current_user.id)
        return comment
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# 更新评论
@router.put("/{comment_id}", response_model=Comment)
def update_comment_endpoint(
    comment_id: int,
    comment_in: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    comment = get_comment(db, comment_id=comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    updated_comment = update_comment(db=db, comment_id=comment_id, comment_in=comment_in)
    if not updated_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return updated_comment

# 删除评论
@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment_endpoint(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    comment = get_comment(db, comment_id=comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    success = delete_comment(db=db, comment_id=comment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Comment not found")
    return None
