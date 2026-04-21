"""
Favorite CRUD - YashanDB 原生 SQL 版本
"""
from typing import List, Optional, Dict, Any


def get_favorite(db, favorite_id: int) -> Optional[Dict[str, Any]]:
    """通过ID获取收藏"""
    from app.db.yasdb_pool import query_one
    return query_one("SELECT * FROM favorites WHERE id = :id", {"id": favorite_id})


def is_favorited_by_user(db, user_id: int, article_id: int) -> bool:
    """检查用户是否已收藏文章"""
    from app.db.yasdb_pool import query_one
    result = query_one("""
        SELECT id FROM favorites 
        WHERE user_id = :user_id AND article_id = :article_id
    """, {"user_id": user_id, "article_id": article_id})
    return result is not None


def get_favorites_by_user(db, user_id: int, skip: int = 0, limit: int = 10) -> List[Dict[str, Any]]:
    """获取用户的所有收藏"""
    from app.db.yasdb_pool import query_all
    return query_all(f"""
        SELECT * FROM favorites 
        WHERE user_id = :user_id
        ORDER BY created_at DESC
        OFFSET {skip} ROWS FETCH NEXT {limit} ROWS ONLY
    """, {"user_id": user_id}) or []


def create_favorite(db, favorite_in, user_id: int) -> Dict[str, Any]:
    """创建收藏"""
    from app.db.yasdb_pool import get_next_id, execute_sql, query_one
    
    # 检查是否已收藏
    if is_favorited_by_user(db, user_id, favorite_in.article_id):
        raise ValueError("Already favorited this article")
    
    new_id = get_next_id('favorites')
    
    sql = """
        INSERT INTO favorites (id, user_id, article_id, created_at)
        VALUES (:id, :user_id, :article_id, SYSTIMESTAMP)
    """
    execute_sql(sql, {
        'id': new_id,
        'user_id': user_id,
        'article_id': favorite_in.article_id
    })
    
    return get_favorite(db, new_id)


def delete_favorite(db, user_id: int, article_id: int) -> bool:
    """删除收藏"""
    from app.db.yasdb_pool import execute_sql, query_one
    
    result = query_one("""
        SELECT id FROM favorites 
        WHERE user_id = :user_id AND article_id = :article_id
    """, {"user_id": user_id, "article_id": article_id})
    
    if not result:
        return False
    
    execute_sql("DELETE FROM favorites WHERE user_id = :user_id AND article_id = :article_id", {
        "user_id": user_id,
        "article_id": article_id
    })
    return True
