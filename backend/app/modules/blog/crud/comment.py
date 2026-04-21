from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.modules.blog.models.comment import Comment
from app.modules.blog.schemas.comment import CommentCreate, CommentUpdate

# 通过ID获取评论
def get_comment(db: Session, comment_id: int) -> Optional[Comment]:
    return db.query(Comment).filter(Comment.id == comment_id).options(
        joinedload(Comment.author),
        joinedload(Comment.replies).joinedload(Comment.author)
    ).first()

# 获取文章的所有评论
def get_comments_by_article(db: Session, article_id: int, skip: int = 0, limit: int = 20) -> List[Comment]:
    return db.query(Comment).filter(
        Comment.article_id == article_id,
        Comment.parent_id == None
    ).options(
        joinedload(Comment.author),
        joinedload(Comment.replies).joinedload(Comment.author)
    ).order_by(Comment.created_at.desc()).offset(skip).limit(limit).all()

# 创建评论
def create_comment(db: Session, comment_in: CommentCreate, author_id: int) -> Comment:
    db_comment = Comment(
        content=comment_in.content,
        article_id=comment_in.article_id,
        author_id=author_id,
        parent_id=comment_in.parent_id
    )
    
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

# 更新评论
def update_comment(db: Session, comment_id: int, comment_in: CommentUpdate) -> Optional[Comment]:
    db_comment = get_comment(db, comment_id)
    if not db_comment:
        return None
    
    update_data = comment_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_comment, field, value)
    
    db.commit()
    db.refresh(db_comment)
    return db_comment

# 删除评论
def delete_comment(db: Session, comment_id: int) -> bool:
    db_comment = get_comment(db, comment_id)
    if not db_comment:
        return False
    
    db.delete(db_comment)
    db.commit()
    return True
