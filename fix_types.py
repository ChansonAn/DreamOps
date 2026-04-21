import re

# Fix API to support multiple types
with open(r'I:\APP\dreamops\backend\app\api\cmdb_yasdb.py', 'r', encoding='utf-8') as f:
    api_content = f.read()

# Change the endpoint signature to accept multiple types
old_sig = '''@router.get("/config-items", response_model=List[CMDBConfigItem])
async def read_config_items(
    skip: int = 0,
    limit: int = 100,
    type: Optional[str] = Query(None, description="配置项类型"),
    environment: Optional[str] = Query(None, description="环境"),
    keyword: Optional[str] = Query(None, description="关键词搜索（名称/IP/主机名/业务线）"),
    business_line: Optional[str] = Query(None, description="业务线"),
    db = Depends(get_db)
):
    items = get_config_items(db, skip=skip, limit=limit, item_type=type,
                            environment=environment, keyword=keyword,
                            business_line=business_line)'''

new_sig = '''@router.get("/config-items", response_model=List[CMDBConfigItem])
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
                            business_line=business_line)'''

api_content = api_content.replace(old_sig, new_sig)

with open(r'I:\APP\dreamops\backend\app\api\cmdb_yasdb.py', 'w', encoding='utf-8') as f:
    f.write(api_content)

print('API fixed')

# Fix CRUD to support multiple types
with open(r'I:\APP\dreamops\backend\app\crud\cmdb_yasdb.py', 'r', encoding='utf-8') as f:
    crud_content = f.read()

old_func = '''def get_config_items(db, skip: int = 0, limit: int = 100, item_type: Optional[str] = None,
                    environment: Optional[str] = None, keyword: Optional[str] = None,
                    business_line: Optional[str] = None) -> List[Dict[str, Any]]:
    """获取配置项列表，支持类型、环境、关键词过滤"""
    from app.db.yasdb_pool import query_all
    
    conditions = []
    params = {}
    if item_type:
        conditions.append("type = :type")
        params["type"] = item_type'''

new_func = '''def get_config_items(db, skip: int = 0, limit: int = 100, types: Optional[List[str]] = None,
                    environment: Optional[str] = None, keyword: Optional[str] = None,
                    business_line: Optional[str] = None) -> List[Dict[str, Any]]:
    """获取配置项列表，支持多类型、环境、关键词过滤"""
    from app.db.yasdb_pool import query_all
    
    conditions = []
    params = {}
    if types:
        # 支持多类型过滤
        type_placeholders = []
        for i, t in enumerate(types):
            ph = f"type_{i}"
            type_placeholders.append(f":{ph}")
            params[ph] = t
        conditions.append(f"type IN ({', '.join(type_placeholders)})")'''

crud_content = crud_content.replace(old_func, new_func)

with open(r'I:\APP\dreamops\backend\app\crud\cmdb_yasdb.py', 'w', encoding='utf-8') as f:
    f.write(crud_content)

print('CRUD fixed')
