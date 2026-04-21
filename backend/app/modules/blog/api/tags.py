from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.modules.blog.schemas.tag import Tag, TagCreate, TagUpdate
from app.modules.blog.crud.tag import (
    get_tag, get_tag_by_name, create_tag, update_tag, delete_tag, get_tags
)
from app.modules.user.api.users import get_current_active_user
from app.modules.user.schemas.user import User

router = APIRouter()

# 获取所有标签
@router.get("/", response_model=List[Tag])
def read_tags(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tags = get_tags(db, skip=skip, limit=limit)
    return tags

# 获取指定标签
@router.get("/{tag_id}", response_model=Tag)
def read_tag(tag_id: int, db: Session = Depends(get_db)):
    tag = get_tag(db, tag_id=tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag

# 创建标签
@router.post("/", response_model=Tag, status_code=status.HTTP_201_CREATED)
def create_tag_endpoint(
    tag_in: TagCreate,
    db: Session = Depends(get_db)
):
    try:
        tag = create_tag(db=db, tag_in=tag_in)
        return tag
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# 更新标签
@router.put("/{tag_id}", response_model=Tag)
def update_tag_endpoint(
    tag_id: int,
    tag_in: TagUpdate,
    db: Session = Depends(get_db)
):
    try:
        tag = update_tag(db=db, tag_id=tag_id, tag_in=tag_in)
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        return tag
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# 删除标签
@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag_endpoint(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    success = delete_tag(db=db, tag_id=tag_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tag not found")
    return None
