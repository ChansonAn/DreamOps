from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas.cmdb import CMDBConfigItem, CMDBConfigItemCreate, CMDBConfigItemUpdate, CMDBRelationship, CMDBRelationshipCreate, CMDTag, CMDTagCreate
from app.crud.cmdb import (
    get_config_items,
    get_config_item,
    create_config_item,
    update_config_item,
    delete_config_item,
    get_relationships,
    get_item_relationships,
    create_relationship,
    delete_relationship,
    get_tags,
    get_tag,
    create_tag,
    delete_tag
)
from app.db.database import get_db
import json

router = APIRouter()

# 获取配置项列表
@router.get("/config-items", response_model=List[CMDBConfigItem])
async def read_config_items(
    skip: int = 0,
    limit: int = 100,
    type: Optional[str] = Query(None, description="配置项类型"),
    db: Session = Depends(get_db)
):
    items = get_config_items(db, skip=skip, limit=limit, item_type=type)
    # 转换tags为列表格式
    for item in items:
        tags_str = item.tags
        if tags_str and isinstance(tags_str, str) and tags_str.strip():
            try:
                item.tags = json.loads(tags_str)
            except (json.JSONDecodeError, TypeError):
                item.tags = []
        else:
            item.tags = []
    return items

# 获取单个配置项
@router.get("/config-items/{item_id}", response_model=CMDBConfigItem)
async def read_config_item(
    item_id: str,
    db: Session = Depends(get_db)
):
    item = get_config_item(db, item_id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Config item not found")
    # 转换tags为列表格式
    tags_str = item.tags
    if tags_str and isinstance(tags_str, str) and tags_str.strip():
        try:
            item.tags = json.loads(tags_str)
        except (json.JSONDecodeError, TypeError):
            item.tags = []
    else:
        item.tags = []
    return item

# 创建配置项
@router.post("/config-items", response_model=CMDBConfigItem)
async def create_new_config_item(
    item_in: CMDBConfigItemCreate,
    db: Session = Depends(get_db)
):
    # 检查配置项ID是否已存在
    existing_item = get_config_item(db, item_id=item_in.id)
    if existing_item:
        raise HTTPException(status_code=400, detail="Config item ID already exists")
    
    item = create_config_item(db, item_in=item_in)
    # 转换tags为列表格式
    tags_str = item.tags
    if tags_str and isinstance(tags_str, str) and tags_str.strip():
        try:
            item.tags = json.loads(tags_str)
        except (json.JSONDecodeError, TypeError):
            item.tags = []
    else:
        item.tags = []
    return item

# 更新配置项
@router.put("/config-items/{item_id}", response_model=CMDBConfigItem)
async def update_existing_config_item(
    item_id: str,
    item_in: CMDBConfigItemUpdate,
    db: Session = Depends(get_db)
):
    item = update_config_item(db, item_id=item_id, item_in=item_in)
    if not item:
        raise HTTPException(status_code=404, detail="Config item not found")
    # 转换tags为列表格式
    tags_str = item.tags
    if tags_str and isinstance(tags_str, str) and tags_str.strip():
        try:
            item.tags = json.loads(tags_str)
        except (json.JSONDecodeError, TypeError):
            item.tags = []
    else:
        item.tags = []
    return item

# 删除配置项
@router.delete("/config-items/{item_id}")
async def delete_existing_config_item(
    item_id: str,
    db: Session = Depends(get_db)
):
    success = delete_config_item(db, item_id=item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Config item not found")
    return {"message": "Config item deleted successfully"}

# 获取关系列表
@router.get("/relationships", response_model=List[CMDBRelationship])
async def read_relationships(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_relationships(db, skip=skip, limit=limit)

# 获取配置项的关系
@router.get("/config-items/{item_id}/relationships", response_model=List[CMDBRelationship])
async def read_item_relationships(
    item_id: str,
    db: Session = Depends(get_db)
):
    # 检查配置项是否存在
    item = get_config_item(db, item_id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Config item not found")
    return get_item_relationships(db, item_id=item_id)

# 创建关系
@router.post("/relationships", response_model=CMDBRelationship)
async def create_new_relationship(
    relationship_in: CMDBRelationshipCreate,
    db: Session = Depends(get_db)
):
    # 检查源配置项是否存在
    source_item = get_config_item(db, item_id=relationship_in.source)
    if not source_item:
        raise HTTPException(status_code=404, detail="Source config item not found")
    
    # 检查目标配置项是否存在
    target_item = get_config_item(db, item_id=relationship_in.target)
    if not target_item:
        raise HTTPException(status_code=404, detail="Target config item not found")
    
    return create_relationship(db, relationship_in=relationship_in)

# 删除关系
@router.delete("/relationships/{relationship_id}")
async def delete_existing_relationship(
    relationship_id: int,
    db: Session = Depends(get_db)
):
    success = delete_relationship(db, relationship_id=relationship_id)
    if not success:
        raise HTTPException(status_code=404, detail="Relationship not found")
    return {"message": "Relationship deleted successfully"}

# 获取标签列表
@router.get("/tags", response_model=List[CMDTag])
async def read_tags(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return get_tags(db, skip=skip, limit=limit)

# 获取单个标签
@router.get("/tags/{tag_id}", response_model=CMDTag)
async def read_tag(
    tag_id: str,
    db: Session = Depends(get_db)
):
    tag = get_tag(db, tag_id=tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag

# 创建标签
@router.post("/tags", response_model=CMDTag)
async def create_new_tag(
    tag_in: CMDTagCreate,
    db: Session = Depends(get_db)
):
    # 检查标签ID是否已存在
    existing_tag = get_tag(db, tag_id=tag_in.id)
    if existing_tag:
        raise HTTPException(status_code=400, detail="Tag ID already exists")
    
    return create_tag(db, tag_in=tag_in)

# 删除标签
@router.delete("/tags/{tag_id}")
async def delete_existing_tag(
    tag_id: str,
    db: Session = Depends(get_db)
):
    success = delete_tag(db, tag_id=tag_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tag not found")
    return {"message": "Tag deleted successfully"}
