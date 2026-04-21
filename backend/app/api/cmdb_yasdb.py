"""
CMDB API - YashanDB 版本
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.schemas.cmdb import CMDBConfigItem, CMDBConfigItemCreate, CMDBConfigItemUpdate, CMDBRelationship, CMDBRelationshipCreate, CMDTag, CMDTagCreate
from app.crud.cmdb_yasdb import (
    get_config_items,
    get_config_item,
    create_config_item,
    update_config_item,
    delete_config_item,
    get_relationships,
    get_item_relationships,
    create_relationship,
    delete_relationship,
    get_cmdb_tags as get_tags,
    get_cmdb_tag as get_tag,
    create_cmdb_tag as create_tag,
    delete_cmdb_tag as delete_tag
)
from app.db.yasdb_pool import get_db
import json

router = APIRouter()


# 获取配置项列表
@router.get("/config-items", response_model=List[CMDBConfigItem])
async def read_config_items(
    skip: int = 0,
    limit: int = 100,
    type: Optional[str] = Query(None, description="配置项类型(单个)"),
    types: Optional[str] = Query(None, description="配置项类型(多个,逗号分隔)"),
    environment: Optional[str] = Query(None, description="环境"),
    keyword: Optional[str] = Query(None, description="关键词搜索（名称/IP/主机名/业务线）"),
    business_line: Optional[str] = Query(None, description="业务线"),
    db = Depends(get_db)
):
    # 处理多类型参数
    type_list = None
    if types:
        type_list = [t.strip() for t in types.split(",") if t.strip()]
    elif type:
        type_list = [type]
    items = get_config_items(db, skip=skip, limit=limit, types=type_list,
                            environment=environment, keyword=keyword,
                            business_line=business_line)
    # 转换tags为列表格式
    for item in items:
        tags_str = item.get('tags')
        if tags_str and isinstance(tags_str, str) and tags_str.strip():
            try:
                item['tags'] = json.loads(tags_str)
            except (json.JSONDecodeError, TypeError):
                item['tags'] = []
        else:
            item['tags'] = []
    return items


# 获取单个配置项
@router.get("/config-items/{item_id}", response_model=CMDBConfigItem)
async def read_config_item(
    item_id: str,
    db = Depends(get_db)
):
    item = get_config_item(db, item_id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Config item not found")
    # 转换tags为列表格式
    tags_str = item.get('tags')
    if tags_str and isinstance(tags_str, str) and tags_str.strip():
        try:
            item['tags'] = json.loads(tags_str)
        except (json.JSONDecodeError, TypeError):
            item['tags'] = []
    else:
        item['tags'] = []
    return item


# 创建配置项
@router.post("/config-items", response_model=CMDBConfigItem)
async def create_new_config_item(
    item_in: CMDBConfigItemCreate,
    db = Depends(get_db)
):
    # 调试：打印收到的请求体
    print(f"=== CMDB Create Request ===")
    print(f"  id: {item_in.id}")
    print(f"  name: {item_in.name}")
    print(f"  type: {item_in.type}")
    print(f"  ip: {item_in.ip}")
    print(f"  ssh_port: {item_in.ssh_port}")
    print(f"  ssh_username: {item_in.ssh_username}")
    print(f"  ssh_password: {item_in.ssh_password}")
    print(f"  full model: {item_in.model_dump()}")
    
    # 如果 id 为空或以 'new-' 开头，自动生成新 id
    import time
    if not item_in.id or str(item_in.id).startswith('new-'):
        item_in.id = f"cfg-{int(time.time() * 1000)}"
    
    # 检查配置项ID是否已存在
    existing_item = get_config_item(db, item_id=item_in.id)
    if existing_item:
        # 如果冲突，添加随机后缀
        import random
        item_in.id = f"cfg-{int(time.time() * 1000)}-{random.randint(1000, 9999)}"
    
    item = create_config_item(db, item_in=item_in)
    # 转换tags为列表格式
    tags_str = item.get('tags')
    if tags_str and isinstance(tags_str, str) and tags_str.strip():
        try:
            item['tags'] = json.loads(tags_str)
        except (json.JSONDecodeError, TypeError):
            item['tags'] = []
    else:
        item['tags'] = []
    return item


# 更新配置项
@router.put("/config-items/{item_id}", response_model=CMDBConfigItem)
async def update_existing_config_item(
    item_id: str,
    item_in: CMDBConfigItemUpdate,
    db = Depends(get_db)
):
    item = update_config_item(db, item_id=item_id, item_in=item_in)
    if not item:
        raise HTTPException(status_code=404, detail="Config item not found")
    # 转换tags为列表格式
    tags_str = item.get('tags')
    if tags_str and isinstance(tags_str, str) and tags_str.strip():
        try:
            item['tags'] = json.loads(tags_str)
        except (json.JSONDecodeError, TypeError):
            item['tags'] = []
    else:
        item['tags'] = []
    return item


# 删除配置项
@router.delete("/config-items/{item_id}")
async def delete_existing_config_item(
    item_id: str,
    db = Depends(get_db)
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
    db = Depends(get_db)
):
    return get_relationships(db, skip=skip, limit=limit)


# 获取配置项的关系
@router.get("/config-items/{item_id}/relationships", response_model=List[CMDBRelationship])
async def read_item_relationships(
    item_id: str,
    db = Depends(get_db)
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
    db = Depends(get_db)
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
    db = Depends(get_db)
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
    db = Depends(get_db)
):
    return get_tags(db, skip=skip, limit=limit)


# 获取单个标签
@router.get("/tags/{tag_id}", response_model=CMDTag)
async def read_tag(
    tag_id: str,
    db = Depends(get_db)
):
    tag = get_tag(db, tag_id=tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


# 创建标签
@router.post("/tags", response_model=CMDTag)
async def create_new_tag(
    tag_in: CMDTagCreate,
    db = Depends(get_db)
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
    db = Depends(get_db)
):
    success = delete_tag(db, tag_id=tag_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tag not found")
    return {"message": "Tag deleted successfully"}
