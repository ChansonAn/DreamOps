from sqlalchemy.orm import Session
from typing import List, Optional
from app.modules.blog.models.tag import Tag
from app.modules.blog.schemas.tag import TagCreate, TagUpdate

# 通过ID获取标签
def get_tag(db: Session, tag_id: int) -> Optional[Tag]:
    return db.query(Tag).filter(Tag.id == tag_id).first()

# 通过名称获取标签
def get_tag_by_name(db: Session, name: str) -> Optional[Tag]:
    return db.query(Tag).filter(Tag.name == name).first()

# 获取所有标签
def get_tags(db: Session, skip: int = 0, limit: int = 100) -> List[Tag]:
    return db.query(Tag).offset(skip).limit(limit).all()

# 创建标签
def create_tag(db: Session, tag_in: TagCreate) -> Tag:
    existing_tag = get_tag_by_name(db, name=tag_in.name)
    if existing_tag:
        raise ValueError("Tag name already exists")
    
    slug = tag_in.slug
    if not slug:
        slug = tag_in.name.lower().replace(" ", "-")
    
    db_tag = Tag(
        name=tag_in.name,
        slug=slug
    )
    
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag

# 更新标签
def update_tag(db: Session, tag_id: int, tag_in: TagUpdate) -> Optional[Tag]:
    db_tag = get_tag(db, tag_id)
    if not db_tag:
        return None
    
    update_data = tag_in.dict(exclude_unset=True)
    
    if "name" in update_data and update_data["name"] != db_tag.name:
        existing_tag = get_tag_by_name(db, name=update_data["name"])
        if existing_tag:
            raise ValueError("Tag name already exists")
    
    for field, value in update_data.items():
        setattr(db_tag, field, value)
    
    db.commit()
    db.refresh(db_tag)
    return db_tag

# 删除标签
def delete_tag(db: Session, tag_id: int) -> bool:
    db_tag = get_tag(db, tag_id)
    if not db_tag:
        return False
    
    db.delete(db_tag)
    db.commit()
    return True
