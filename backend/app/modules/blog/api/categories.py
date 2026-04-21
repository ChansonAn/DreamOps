from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.modules.blog.schemas.category import Category, CategoryCreate, CategoryUpdate
from app.modules.blog.crud.category import (
    get_category, get_category_by_name, create_category, update_category, delete_category, get_categories
)
from app.modules.user.api.users import get_current_active_user
from app.modules.user.schemas.user import User

router = APIRouter()

# 获取所有分类
@router.get("/", response_model=List[Category])
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    categories = get_categories(db, skip=skip, limit=limit)
    return categories

# 获取指定分类
@router.get("/{category_id}", response_model=Category)
def read_category(category_id: int, db: Session = Depends(get_db)):
    category = get_category(db, category_id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

# 创建分类
@router.post("/", response_model=Category, status_code=status.HTTP_201_CREATED)
def create_category_endpoint(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        category = create_category(db=db, category_in=category_in)
        return category
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# 更新分类
@router.put("/{category_id}", response_model=Category)
def update_category_endpoint(
    category_id: int,
    category_in: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        category = update_category(db=db, category_id=category_id, category_in=category_in)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        return category
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# 删除分类
@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category_endpoint(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    success = delete_category(db=db, category_id=category_id)
    if not success:
        raise HTTPException(status_code=404, detail="Category not found")
    return None
