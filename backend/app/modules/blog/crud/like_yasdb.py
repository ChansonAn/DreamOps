"""
Like CRUD - YashanDB 原生 SQL 版本
"""
from typing import List, Optional, Dict, Any


def get_like(db, like_id: int) -> Optional[Dict[str, Any]]:
    """通过ID获取点赞"""
    from app.db.yasdb_pool import query_one
    return query_one("SELECT * FROM likes WHERE id = :id", {"id": like_id})


def is_liked_by_user(db, user_id: int, article_id: int) -> bool:
    """检查用户是否已点赞文章"""
    from app.db.yasdb_pool import query_one
    result = query_one("""
        SELECT id FROM likes 
        WHERE user_id = :user_id AND article_id = :article_id
    """, {"user_id": user_id, "article_id": article_id})
    return result is not None


def get_likes_by_user(db, user_id: int, skip: int = 0, limit: int = 10) -> List[Dict[str, Any]]:
    """获取用户的所有点赞"""
    from app.db.yasdb_pool import query_all
    return query_all(f"""
        SELECT * FROM likes 
        WHERE user_id = :user_id
        ORDER BY created_at DESC
        OFFSET {skip} ROWS FETCH NEXT {limit} ROWS ONLY
    """, {"user_id": user_id}) or []


def get_likes_by_article(db, article_id: int, skip: int = 0, limit: int = 10) -> List[Dict[str, Any]]:
    """获取文章的所有点赞"""
    from app.db.yasdb_pool import query_all
    return query_all(f"""
        SELECT * FROM likes 
        WHERE article_id = :article_id
        ORDER BY created_at DESC
        OFFSET {skip} ROWS FETCH NEXT {limit} ROWS ONLY
    """, {"article_id": article_id}) or []


def get_like_count_by_article(db, article_id: int) -> int:
    """获取文章的点赞数"""
    from app.db.yasdb_pool import query_one
    result = query_one("SELECT COUNT(*) as cnt FROM likes WHERE article_id = :article_id", {"article_id": article_id})
    return result['cnt'] if result else 0


def create_like(db, like_in, user_id: int) -> Dict[str, Any]:
    """创建点赞"""
    from app.db.yasdb_pool import get_next_id, execute_sql, query_one
    
    # 检查是否已点赞
    if is_liked_by_user(db, user_id, like_in.article_id):
        raise ValueError("Already liked this article")
    
    new_id = get_next_id('likes')
    
    sql = """
        INSERT INTO likes (id, user_id, article_id, created_at)
        VALUES (:id, :user_id, :article_id, SYSTIMESTAMP)
    """
    execute_sql(sql, {
        'id': new_id,
        'user_id': user_id,
        'article_id': like_in.article_id
    })
    
    return get_like(db, new_id)


def delete_like(db, user_id: int, article_id: int) -> bool:
    """删除点赞"""
    from app.db.yasdb_pool import execute_sql, query_one
    
    result = query_one("""
        SELECT id FROM likes 
        WHERE user_id = :user_id AND article_id = :article_id
    """, {"user_id": user_id, "article_id": article_id})
    
    if not result:
        return False
    
    execute_sql("DELETE FROM likes WHERE user_id = :user_id AND article_id = :article_id", {
        "user_id": user_id,
        "article_id": article_id
    })
    return True
