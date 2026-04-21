"""
Category CRUD - YashanDB 原生 SQL 版本
"""
from typing import List, Optional, Dict, Any


def get_category(db, category_id: int) -> Optional[Dict[str, Any]]:
    """通过ID获取分类"""
    from app.db.yasdb_pool import query_one
    return query_one("SELECT * FROM categories WHERE id = :id", {"id": category_id})


def get_category_by_name(db, name: str) -> Optional[Dict[str, Any]]:
    """通过名称获取分类"""
    from app.db.yasdb_pool import query_one
    return query_one("SELECT * FROM categories WHERE name = :name", {"name": name})


def get_categories(db, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """获取所有分类"""
    from app.db.yasdb_pool import query_all
    sql = f"SELECT * FROM categories ORDER BY id OFFSET {skip} ROWS FETCH NEXT {limit} ROWS ONLY"
    return query_all(sql) or []


def create_category(db, category_in) -> Dict[str, Any]:
    """创建分类"""
    from app.db.yasdb_pool import get_next_id, execute_sql, query_one
    
    existing = get_category_by_name(db, category_in.name)
    if existing:
        raise ValueError("Category name already exists")
    
    new_id = get_next_id('categories')
    
    sql = """
        INSERT INTO categories (id, name, description, created_at, updated_at)
        VALUES (:id, :name, :description, SYSTIMESTAMP, SYSTIMESTAMP)
    """
    execute_sql(sql, {
        'id': new_id,
        'name': category_in.name,
        'description': getattr(category_in, 'description', None)
    })
    
    return get_category(db, new_id)


def update_category(db, category_id: int, category_in) -> Optional[Dict[str, Any]]:
    """更新分类"""
    from app.db.yasdb_pool import execute_sql, query_one
    
    db_category = get_category(db, category_id)
    if not db_category:
        return None
    
    update_data = category_in.dict(exclude_unset=True) if hasattr(category_in, 'dict') else dict(category_in)
    
    if "name" in update_data and update_data["name"] != db_category['name']:
        existing = get_category_by_name(db, update_data["name"])
        if existing:
            raise ValueError("Category name already exists")
    
    if update_data:
        set_clauses = []
        params = {'id': category_id}
        for field, value in update_data.items():
            set_clauses.append(f"{field} = :{field}")
            params[field] = value
        set_clauses.append("updated_at = SYSTIMESTAMP")
        
        sql = f"UPDATE categories SET {', '.join(set_clauses)} WHERE id = :id"
        execute_sql(sql, params)
    
    return get_category(db, category_id)


def delete_category(db, category_id: int) -> bool:
    """删除分类"""
    from app.db.yasdb_pool import execute_sql
    
    category = get_category(db, category_id)
    if not category:
        return False
    
    execute_sql("DELETE FROM categories WHERE id = :id", {"id": category_id})
    return True
