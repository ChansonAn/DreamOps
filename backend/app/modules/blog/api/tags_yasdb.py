"""
Tags API - YashanDB 版本
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.db.yasdb_pool import get_db
from app.modules.blog.schemas.tag import Tag, TagCreate, TagUpdate
from app.modules.blog.crud.tag_yasdb import (
    get_tag, get_tags, create_tag, update_tag, delete_tag
)
from app.modules.user.api.users_yasdb import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[Tag])
def read_tags(skip: int = 0, limit: int = 100):
    with get_db() as db:
        return get_tags(db, skip=skip, limit=limit)


@router.get("/{tag_id}", response_model=Tag)
def read_tag(tag_id: int):
    with get_db() as db:
        tag = get_tag(db, tag_id=tag_id)
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        return tag


@router.post("/", response_model=Tag, status_code=status.HTTP_201_CREATED)
def create_tag_endpoint(tag_in: TagCreate, current_user = Depends(get_current_active_user)):
    with get_db() as db:
        try:
            return create_tag(db=db, tag_in=tag_in)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{tag_id}", response_model=Tag)
def update_tag_endpoint(tag_id: int, tag_in: TagUpdate, current_user = Depends(get_current_active_user)):
    with get_db() as db:
        try:
            tag = update_tag(db=db, tag_id=tag_id, tag_in=tag_in)
            if not tag:
                raise HTTPException(status_code=404, detail="Tag not found")
            return tag
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag_endpoint(tag_id: int, current_user = Depends(get_current_active_user)):
    with get_db() as db:
        if not delete_tag(db=db, tag_id=tag_id):
            raise HTTPException(status_code=404, detail="Tag not found")
        return None
