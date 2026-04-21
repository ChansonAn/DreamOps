"""
Tag CRUD - YashanDB 原生 SQL 版本
"""
from typing import List, Optional, Dict, Any


def get_tag(db, tag_id: int) -> Optional[Dict[str, Any]]:
    from app.db.yasdb_pool import query_one
    return query_one("SELECT * FROM tags WHERE id = :id", {"id": tag_id})


def get_tag_by_name(db, name: str) -> Optional[Dict[str, Any]]:
    from app.db.yasdb_pool import query_one
    return query_one("SELECT * FROM tags WHERE name = :name", {"name": name})


def get_tags(db, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    from app.db.yasdb_pool import query_all
    sql = f"SELECT * FROM tags ORDER BY id OFFSET {skip} ROWS FETCH NEXT {limit} ROWS ONLY"
    return query_all(sql) or []


def create_tag(db, tag_in) -> Dict[str, Any]:
    from app.db.yasdb_pool import get_next_id, execute_sql, query_one
    
    existing = get_tag_by_name(db, tag_in.name)
    if existing:
        raise ValueError("Tag name already exists")
    
    new_id = get_next_id('tags')
    
    sql = """
        INSERT INTO tags (id, name)
        VALUES (:id, :name)
    """
    execute_sql(sql, {'id': new_id, 'name': tag_in.name})
    
    return get_tag(db, new_id)


def update_tag(db, tag_id: int, tag_in) -> Optional[Dict[str, Any]]:
    from app.db.yasdb_pool import execute_sql, query_one
    
    db_tag = get_tag(db, tag_id)
    if not db_tag:
        return None
    
    update_data = tag_in.dict(exclude_unset=True) if hasattr(tag_in, 'dict') else dict(tag_in)
    
    if "name" in update_data and update_data["name"] != db_tag['name']:
        existing = get_tag_by_name(db, update_data["name"])
        if existing:
            raise ValueError("Tag name already exists")
    
    if update_data:
        set_clauses = []
        params = {'id': tag_id}
        for field, value in update_data.items():
            set_clauses.append(f"{field} = :{field}")
            params[field] = value
        
        sql = f"UPDATE tags SET {', '.join(set_clauses)} WHERE id = :id"
        execute_sql(sql, params)
    
    return get_tag(db, tag_id)


def delete_tag(db, tag_id: int) -> bool:
    from app.db.yasdb_pool import execute_sql
    
    tag = get_tag(db, tag_id)
    if not tag:
        return False
    
    execute_sql("DELETE FROM article_tags WHERE tag_id = :tag_id", {"tag_id": tag_id})
    execute_sql("DELETE FROM tags WHERE id = :id", {"id": tag_id})
    return True
