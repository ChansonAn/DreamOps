from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from app.modules.blog.models.article import Article
from app.modules.blog.models.tag import Tag
from app.modules.blog.schemas.article import ArticleCreate, ArticleUpdate
from app.modules.blog.crud.category import get_category
from app.modules.blog.crud.tag import get_tag

# 通过ID获取文章
def get_article(db: Session, article_id: int, load_relations: bool = True) -> Optional[Article]:
    query = db.query(Article).filter(Article.id == article_id)
    if load_relations:
        query = query.options(
            joinedload(Article.author),
            joinedload(Article.category),
            joinedload(Article.tags)
        )
    return query.first()

# 获取所有文章
def get_articles(db: Session, skip: int = 0, limit: int = 10, is_published: Optional[bool] = None) -> tuple:
    query = db.query(Article).options(
        joinedload(Article.author),
        joinedload(Article.category),
        joinedload(Article.tags)
    )
    
    if is_published is not None:
        query = query.filter(Article.is_published == is_published)
    
    total = query.count()
    query = query.order_by(Article.created_at.desc())
    articles = query.offset(skip).limit(limit).all()
    return total, articles

# 获取用户的所有文章
def get_articles_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 10) -> tuple:
    query = db.query(Article).filter(Article.author_id == user_id).options(
        joinedload(Article.author),
        joinedload(Article.category),
        joinedload(Article.tags)
    )
    
    total = query.count()
    articles = query.order_by(Article.created_at.desc()).offset(skip).limit(limit).all()
    return total, articles

# 获取分类下的所有文章
def get_articles_by_category(db: Session, category_id: int, skip: int = 0, limit: int = 10) -> tuple:
    query = db.query(Article).filter(Article.category_id == category_id).options(
        joinedload(Article.author),
        joinedload(Article.category),
        joinedload(Article.tags)
    )
    
    total = query.count()
    articles = query.order_by(Article.created_at.desc()).offset(skip).limit(limit).all()
    return total, articles

# 创建文章
def create_article(db: Session, article_in: ArticleCreate, author_id: int) -> Article:
    category = get_category(db, article_in.category_id)
    if not category:
        raise ValueError("Category not found")
    
    db_article = Article(
        title=article_in.title,
        content=article_in.content,
        summary=article_in.excerpt,
        is_published=article_in.is_published,
        cover_image=article_in.cover_image,
        author_id=author_id,
        category_id=article_in.category_id
    )
    
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    
    if article_in.tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(article_in.tag_ids)).all()
        db_article.tags = tags
        db.commit()
        db.refresh(db_article)
    
    return db_article

# 更新文章
def update_article(db: Session, article_id: int, article_in: ArticleUpdate) -> Optional[Article]:
    db_article = get_article(db, article_id, load_relations=False)
    if not db_article:
        return None
    
    update_data = article_in.dict(exclude_unset=True)
    
    if "category_id" in update_data:
        category = get_category(db, update_data["category_id"])
        if not category:
            raise ValueError("Category not found")
    
    if "excerpt" in update_data:
        update_data["summary"] = update_data.pop("excerpt")
    
    tag_ids = update_data.pop("tag_ids", None)
    
    for field, value in update_data.items():
        setattr(db_article, field, value)
    
    if tag_ids is not None:
        tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
        db_article.tags = tags
    
    db.commit()
    db.refresh(db_article)
    return db_article

# 删除文章
def delete_article(db: Session, article_id: int) -> bool:
    db_article = get_article(db, article_id, load_relations=False)
    if not db_article:
        return False
    
    db.delete(db_article)
    db.commit()
    return True

# 增加文章浏览量
def increment_article_view_count(db: Session, article_id: int) -> Optional[Article]:
    db_article = get_article(db, article_id, load_relations=False)
    if not db_article:
        return None
    
    db_article.view_count += 1
    db.commit()
    db.refresh(db_article)
    return db_article
