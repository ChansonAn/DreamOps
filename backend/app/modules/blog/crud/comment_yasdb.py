"""
Comment CRUD - YashanDB 原生 SQL 版本
"""
from typing import List, Optional, Dict, Any


def get_comment(db, comment_id: int) -> Optional[Dict[str, Any]]:
    """通过ID获取评论"""
    from app.db.yasdb_pool import query_one
    comment = query_one("SELECT * FROM comments WHERE id = :id", {"id": comment_id})
    if comment:
        # 获取作者
        from app.db.yasdb_pool import query_one as q1
        author = q1("SELECT id, username, email, avatar, bio FROM users WHERE id = :id", {"id": comment['author_id']})
        comment['author'] = author
    return comment


def get_comments_by_article(db, article_id: int, skip: int = 0, limit: int = 20) -> List[Dict[str, Any]]:
    """获取文章的所有评论（只获取顶级评论）"""
    from app.db.yasdb_pool import query_all, query_one
    
    comments = query_all(f"""
        SELECT * FROM comments 
        WHERE article_id = :article_id AND parent_id IS NULL
        ORDER BY created_at DESC
        OFFSET {skip} ROWS FETCH NEXT {limit} ROWS ONLY
    """, {"article_id": article_id}) or []
    
    # 填充作者信息
    for comment in comments:
        author = query_one("SELECT id, username, email, avatar, bio FROM users WHERE id = :id", {"id": comment['author_id']})
        comment['author'] = author
        
        # 获取回复
        replies = query_all("""
            SELECT * FROM comments 
            WHERE parent_id = :parent_id
            ORDER BY created_at ASC
        """, {"parent_id": comment['id']}) or []
        
        for reply in replies:
            reply_author = query_one("SELECT id, username, email, avatar, bio FROM users WHERE id = :id", {"id": reply['author_id']})
            reply['author'] = reply_author
        
        comment['replies'] = replies
    
    return comments


def create_comment(db, comment_in, author_id: int) -> Dict[str, Any]:
    """创建评论"""
    from app.db.yasdb_pool import get_next_id, execute_sql, query_one
    
    new_id = get_next_id('comments')
    
    sql = """
        INSERT INTO comments (id, content, article_id, author_id, parent_id, created_at, updated_at)
        VALUES (:id, :content, :article_id, :author_id, :parent_id, SYSTIMESTAMP, SYSTIMESTAMP)
    """
    execute_sql(sql, {
        'id': new_id,
        'content': comment_in.content,
        'article_id': comment_in.article_id,
        'author_id': author_id,
        'parent_id': getattr(comment_in, 'parent_id', None)
    })
    
    return get_comment(db, new_id)


def update_comment(db, comment_id: int, comment_in) -> Optional[Dict[str, Any]]:
    """更新评论"""
    from app.db.yasdb_pool import execute_sql
    
    comment = get_comment(db, comment_id)
    if not comment:
        return None
    
    update_data = comment_in.dict(exclude_unset=True) if hasattr(comment_in, 'dict') else dict(comment_in)
    
    if update_data:
        set_clauses = ["updated_at = SYSTIMESTAMP"]
        params = {'id': comment_id}
        for field, value in update_data.items():
            set_clauses.append(f"{field} = :{field}")
            params[field] = value
        
        sql = f"UPDATE comments SET {', '.join(set_clauses)} WHERE id = :id"
        execute_sql(sql, params)
    
    return get_comment(db, comment_id)


def delete_comment(db, comment_id: int) -> bool:
    """删除评论"""
    from app.db.yasdb_pool import execute_sql
    
    comment = get_comment(db, comment_id)
    if not comment:
        return False
    
    # 先删除子评论
    execute_sql("DELETE FROM comments WHERE parent_id = :parent_id", {"parent_id": comment_id})
    execute_sql("DELETE FROM comments WHERE id = :id", {"id": comment_id})
    return True
