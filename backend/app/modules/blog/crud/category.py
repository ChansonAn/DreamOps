from sqlalchemy.orm import Session
from typing import List, Optional
from app.modules.blog.models.category import Category
from app.modules.blog.schemas.category import CategoryCreate, CategoryUpdate

# 通过ID获取分类
def get_category(db: Session, category_id: int) -> Optional[Category]:
    return db.query(Category).filter(Category.id == category_id).first()

# 通过名称获取分类
def get_category_by_name(db: Session, name: str) -> Optional[Category]:
    return db.query(Category).filter(Category.name == name).first()

# 获取所有分类
def get_categories(db: Session, skip: int = 0, limit: int = 100) -> List[Category]:
    return db.query(Category).offset(skip).limit(limit).all()

# 创建分类
def create_category(db: Session, category_in: CategoryCreate) -> Category:
    existing_category = get_category_by_name(db, name=category_in.name)
    if existing_category:
        raise ValueError("Category name already exists")
    
    db_category = Category(
        name=category_in.name,
        description=category_in.description
    )
    
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

# 更新分类
def update_category(db: Session, category_id: int, category_in: CategoryUpdate) -> Optional[Category]:
    db_category = get_category(db, category_id)
    if not db_category:
        return None
    
    update_data = category_in.dict(exclude_unset=True)
    
    if "name" in update_data and update_data["name"] != db_category.name:
        existing_category = get_category_by_name(db, name=update_data["name"])
        if existing_category:
            raise ValueError("Category name already exists")
    
    for field, value in update_data.items():
        setattr(db_category, field, value)
    
    db.commit()
    db.refresh(db_category)
    return db_category

# 删除分类
def delete_category(db: Session, category_id: int) -> bool:
    db_category = get_category(db, category_id)
    if not db_category:
        return False
    
    db.delete(db_category)
    db.commit()
    return True
