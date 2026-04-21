"""
Categories API - YashanDB 版本
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.db.yasdb_pool import get_db
from app.modules.blog.schemas.category import Category, CategoryCreate, CategoryUpdate
from app.modules.blog.crud.category_yasdb import (
    get_category, get_categories, create_category, update_category, delete_category
)
from app.modules.user.api.users_yasdb import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[Category])
def read_categories(skip: int = 0, limit: int = 100):
    with get_db() as db:
        return get_categories(db, skip=skip, limit=limit)


@router.get("/{category_id}", response_model=Category)
def read_category(category_id: int):
    with get_db() as db:
        category = get_category(db, category_id=category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        return category


@router.post("/", response_model=Category, status_code=status.HTTP_201_CREATED)
def create_category_endpoint(category_in: CategoryCreate, current_user = Depends(get_current_active_user)):
    with get_db() as db:
        try:
            return create_category(db=db, category_in=category_in)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{category_id}", response_model=Category)
def update_category_endpoint(category_id: int, category_in: CategoryUpdate, current_user = Depends(get_current_active_user)):
    with get_db() as db:
        try:
            category = update_category(db=db, category_id=category_id, category_in=category_in)
            if not category:
                raise HTTPException(status_code=404, detail="Category not found")
            return category
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category_endpoint(category_id: int, current_user = Depends(get_current_active_user)):
    with get_db() as db:
        if not delete_category(db=db, category_id=category_id):
            raise HTTPException(status_code=404, detail="Category not found")
        return None
