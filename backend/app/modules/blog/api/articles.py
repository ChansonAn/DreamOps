from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.modules.blog.schemas.article import Article, ArticleCreate, ArticleUpdate, ArticlePagination
from app.modules.blog.crud.article import (
    get_article, create_article, update_article, delete_article, get_articles,
    get_articles_by_user, get_articles_by_category, increment_article_view_count
)
from app.modules.user.api.users import get_current_active_user
from app.modules.user.schemas.user import User

router = APIRouter()

# 获取所有文章
@router.get("/", response_model=List[Article])
def read_articles(
    is_published: Optional[bool] = Query(None, description="Filter by published status"),
    db: Session = Depends(get_db)
):
    total, articles = get_articles(db, skip=0, limit=None, is_published=is_published)
    return articles

# 获取指定文章（通过ID）
@router.get("/{article_id}", response_model=Article)
def read_article(article_id: int, db: Session = Depends(get_db)):
    article = get_article(db, article_id=article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    increment_article_view_count(db, article_id=article_id)
    return article

# 创建文章
@router.post("/", response_model=Article, status_code=status.HTTP_201_CREATED)
def create_article_endpoint(
    article_in: ArticleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        article = create_article(db=db, article_in=article_in, author_id=current_user.id)
        return article
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# 更新文章
@router.put("/{article_id}", response_model=Article)
def update_article_endpoint(
    article_id: int,
    article_in: ArticleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    article = get_article(db, article_id=article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    if article.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    try:
        updated_article = update_article(db=db, article_id=article_id, article_in=article_in)
        if not updated_article:
            raise HTTPException(status_code=404, detail="Article not found")
        return updated_article
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# 删除文章
@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_article_endpoint(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    article = get_article(db, article_id=article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    if article.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    success = delete_article(db=db, article_id=article_id)
    if not success:
        raise HTTPException(status_code=404, detail="Article not found")
    return None

# 获取用户的所有文章
@router.get("/user/{user_id}", response_model=ArticlePagination)
def read_articles_by_user(
    user_id: int,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    total, articles = get_articles_by_user(db, user_id=user_id, skip=skip, limit=limit)
    return ArticlePagination(total=total, items=articles)

# 获取分类下的所有文章
@router.get("/category/{category_id}", response_model=ArticlePagination)
def read_articles_by_category(
    category_id: int,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    total, articles = get_articles_by_category(db, category_id=category_id, skip=skip, limit=limit)
    return ArticlePagination(total=total, items=articles)

# 测试删除文章的简单路由（仅用于调试）
@router.delete("/test-delete/{article_id}")
def test_delete_article(
    article_id: int,
    db: Session = Depends(get_db)
):
    try:
        success = delete_article(db=db, article_id=article_id)
        if success:
            return {"message": "Article deleted successfully"}
        else:
            return {"message": "Article not found"}
    except Exception as e:
        return {"message": f"Error deleting article: {str(e)}"}
