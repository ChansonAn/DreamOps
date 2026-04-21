"""
Article CRUD - YashanDB 原生 SQL 版本
"""
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime


def _build_article_dict(row: tuple, cols: List[str]) -> Dict[str, Any]:
    """将查询结果转换为文章字典"""
    article = dict(zip(cols, row))
    # 字段映射：崖山列名通常是全大写
    result = {}
    for k, v in article.items():
        result[k.lower()] = v
    return result


def get_article(db, article_id: int, load_relations: bool = True) -> Optional[Dict[str, Any]]:
    """通过ID获取文章"""
    from app.db.yasdb_pool import query_one, query_all
    
    article = query_one("SELECT * FROM articles WHERE id = :id", {"id": article_id})
    if not article:
        return None
    
    if load_relations:
        # 获取作者
        author = query_one("SELECT id, username, email, avatar, bio, is_active, created_at, updated_at FROM users WHERE id = :id", {"id": article['author_id']})
        article['author'] = author
        
        # 获取分类
        category = query_one("SELECT id, name, description, created_at, updated_at FROM categories WHERE id = :id", {"id": article['category_id']})
        article['category'] = category
        
        # 获取标签
        tags = query_all("""
            SELECT t.id, t.name, t.created_at 
            FROM tags t 
            JOIN article_tags at ON t.id = at.tag_id 
            WHERE at.article_id = :article_id
        """, {"article_id": article_id})
        article['tags'] = tags or []
    
    return article


def get_articles(db, skip: int = 0, limit: int = 10, is_published: Optional[bool] = None) -> Tuple[int, List[Dict[str, Any]]]:
    """获取所有文章"""
    from app.db.yasdb_pool import query_one, query_all
    
    # 构建条件
    where_clause = ""
    params = {}
    if is_published is not None:
        where_clause = "WHERE is_published = :is_published"
        params['is_published'] = 1 if is_published else 0
    
    # 获取总数
    count_sql = f"SELECT COUNT(*) as cnt FROM articles {where_clause}"
    count_result = query_one(count_sql, params if where_clause else None)
    total = count_result['cnt'] if count_result else 0
    
    # 获取文章列表
    data_sql = f"""
        SELECT * FROM articles 
        {where_clause}
        ORDER BY created_at DESC
        OFFSET {skip} ROWS FETCH NEXT {limit} ROWS ONLY
    """
    articles = query_all(data_sql, params if where_clause else None) or []
    
    # 填充关联数据
    for article in articles:
        # 作者
        author = query_one("SELECT id, username, email, avatar, bio, is_active, created_at, updated_at FROM users WHERE id = :id", {"id": article['author_id']})
        article['author'] = author
        
        # 分类
        category = query_one("SELECT id, name, description, created_at, updated_at FROM categories WHERE id = :id", {"id": article['category_id']})
        article['category'] = category
        
        # 标签
        tags = query_all("""
            SELECT t.id, t.name, t.created_at 
            FROM tags t 
            JOIN article_tags at ON t.id = at.tag_id 
            WHERE at.article_id = :article_id
        """, {"article_id": article['id']})
        article['tags'] = tags or []
    
    return total, articles


def get_articles_by_user(db, user_id: int, skip: int = 0, limit: int = 10) -> Tuple[int, List[Dict[str, Any]]]:
    """获取用户的所有文章"""
    from app.db.yasdb_pool import query_one, query_all
    
    # 获取总数
    count_result = query_one("SELECT COUNT(*) as cnt FROM articles WHERE author_id = :author_id", {"author_id": user_id})
    total = count_result['cnt'] if count_result else 0
    
    # 获取文章列表
    articles = query_all(f"""
        SELECT * FROM articles 
        WHERE author_id = :author_id
        ORDER BY created_at DESC
        OFFSET {skip} ROWS FETCH NEXT {limit} ROWS ONLY
    """, {"author_id": user_id}) or []
    
    # 填充关联数据
    for article in articles:
        author = query_one("SELECT id, username, email, avatar, bio, is_active, created_at, updated_at FROM users WHERE id = :id", {"id": article['author_id']})
        article['author'] = author
        
        category = query_one("SELECT id, name, description, created_at, updated_at FROM categories WHERE id = :id", {"id": article['category_id']})
        article['category'] = category
        
        tags = query_all("""
            SELECT t.id, t.name, t.created_at 
            FROM tags t 
            JOIN article_tags at ON t.id = at.tag_id 
            WHERE at.article_id = :article_id
        """, {"article_id": article['id']})
        article['tags'] = tags or []
    
    return total, articles


def get_articles_by_category(db, category_id: int, skip: int = 0, limit: int = 10) -> Tuple[int, List[Dict[str, Any]]]:
    """获取分类下的所有文章"""
    from app.db.yasdb_pool import query_one, query_all
    
    # 获取总数
    count_result = query_one("SELECT COUNT(*) as cnt FROM articles WHERE category_id = :category_id", {"category_id": category_id})
    total = count_result['cnt'] if count_result else 0
    
    # 获取文章列表
    articles = query_all(f"""
        SELECT * FROM articles 
        WHERE category_id = :category_id
        ORDER BY created_at DESC
        OFFSET {skip} ROWS FETCH NEXT {limit} ROWS ONLY
    """, {"category_id": category_id}) or []
    
    # 填充关联数据
    for article in articles:
        author = query_one("SELECT id, username, email, avatar, bio, is_active, created_at, updated_at FROM users WHERE id = :id", {"id": article['author_id']})
        article['author'] = author
        
        category = query_one("SELECT id, name, description, created_at, updated_at FROM categories WHERE id = :id", {"id": article['category_id']})
        article['category'] = category
        
        tags = query_all("""
            SELECT t.id, t.name, t.created_at 
            FROM tags t 
            JOIN article_tags at ON t.id = at.tag_id 
            WHERE at.article_id = :article_id
        """, {"article_id": article['id']})
        article['tags'] = tags or []
    
    return total, articles


def create_article(db, article_in, author_id: int) -> Dict[str, Any]:
    """创建文章"""
    from app.db.yasdb_pool import get_next_id, execute_sql, query_one
    
    # 检查分类是否存在
    from app.modules.blog.crud.category_yasdb import get_category
    category = get_category(db, article_in.category_id)
    if not category:
        raise ValueError("Category not found")
    
    # 获取新 ID
    new_id = get_next_id('articles')
    
    # 插入文章
    sql = """
        INSERT INTO articles (id, title, content, summary, is_published, cover_image, author_id, category_id, view_count, created_at, updated_at)
        VALUES (:id, :title, :content, :summary, :is_published, :cover_image, :author_id, :category_id, 0, SYSTIMESTAMP, SYSTIMESTAMP)
    """
    params = {
        'id': new_id,
        'title': article_in.title,
        'content': article_in.content,
        'summary': getattr(article_in, 'excerpt', None),
        'is_published': 1 if getattr(article_in, 'is_published', False) else 0,
        'cover_image': getattr(article_in, 'cover_image', None),
        'author_id': author_id,
        'category_id': article_in.category_id
    }
    execute_sql(sql, params)
    
    # 处理标签
    if hasattr(article_in, 'tag_ids') and article_in.tag_ids:
        for tag_id in article_in.tag_ids:
            execute_sql(
                "INSERT INTO article_tags (article_id, tag_id) VALUES (:article_id, :tag_id)",
                {"article_id": new_id, "tag_id": tag_id}
            )
    
    return get_article(db, new_id)


def update_article(db, article_id: int, article_in) -> Optional[Dict[str, Any]]:
    """更新文章"""
    from app.db.yasdb_pool import execute_sql, query_one
    
    db_article = get_article(db, article_id, load_relations=False)
    if not db_article:
        return None
    
    update_data = article_in.dict(exclude_unset=True) if hasattr(article_in, 'dict') else dict(article_in)
    
    # 检查分类
    if "category_id" in update_data:
        from app.modules.blog.crud.category_yasdb import get_category
        category = get_category(db, update_data["category_id"])
        if not category:
            raise ValueError("Category not found")
    
    # 字段映射
    if "excerpt" in update_data:
        update_data["summary"] = update_data.pop("excerpt")
    
    tag_ids = update_data.pop("tag_ids", None)
    
    # 构建 UPDATE 语句
    if update_data:
        set_clauses = []
        params = {'id': article_id}
        for field, value in update_data.items():
            set_clauses.append(f"{field} = :{field}")
            params[field] = value
        set_clauses.append("updated_at = SYSTIMESTAMP")
        
        sql = f"UPDATE articles SET {', '.join(set_clauses)} WHERE id = :id"
        execute_sql(sql, params)
    
    # 更新标签
    if tag_ids is not None:
        # 删除旧标签
        execute_sql("DELETE FROM article_tags WHERE article_id = :article_id", {"article_id": article_id})
        # 添加新标签
        for tag_id in tag_ids:
            execute_sql(
                "INSERT INTO article_tags (article_id, tag_id) VALUES (:article_id, :tag_id)",
                {"article_id": article_id, "tag_id": tag_id}
            )
    
    return get_article(db, article_id)


def delete_article(db, article_id: int) -> bool:
    """删除文章"""
    from app.db.yasdb_pool import execute_sql
    
    article = get_article(db, article_id, load_relations=False)
    if not article:
        return False
    
    # 删除文章标签关联
    execute_sql("DELETE FROM article_tags WHERE article_id = :article_id", {"article_id": article_id})
    # 删除文章
    execute_sql("DELETE FROM articles WHERE id = :id", {"id": article_id})
    return True


def increment_article_view_count(db, article_id: int) -> Optional[Dict[str, Any]]:
    """增加文章浏览量"""
    from app.db.yasdb_pool import execute_sql
    
    article = get_article(db, article_id, load_relations=False)
    if not article:
        return None
    
    execute_sql("UPDATE articles SET view_count = view_count + 1 WHERE id = :id", {"id": article_id})
    return get_article(db, article_id, load_relations=False)
