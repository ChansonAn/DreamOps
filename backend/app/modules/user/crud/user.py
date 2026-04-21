from sqlalchemy.orm import Session
from typing import List, Optional
from app.modules.user.models.user import User
from app.modules.user.schemas.user import UserCreate, UserUpdate
import bcrypt

def get_password_hash(password: str) -> str:
    truncated_password = password[:72] if len(password) > 72 else password
    password_bytes = truncated_password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    truncated_password = plain_password[:72] if len(plain_password) > 72 else plain_password
    password_bytes = truncated_password.encode('utf-8')
    hash_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hash_bytes)

def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()

def get_users_count(db: Session) -> int:
    return db.query(User).count()

def create_user(db: Session, user_in: UserCreate) -> User:
    existing_user = get_user_by_email(db, email=user_in.email)
    if existing_user:
        raise ValueError("Email already registered")
    
    existing_user = get_user_by_username(db, username=user_in.username)
    if existing_user:
        raise ValueError("Username already registered")
    
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        avatar=user_in.avatar,
        bio=user_in.bio
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_in: UserUpdate) -> Optional[User]:
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_in.dict(exclude_unset=True)
    
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data["password"])
        del update_data["password"]
    
    if "username" in update_data and update_data["username"] != db_user.username:
        existing_user = get_user_by_username(db, username=update_data["username"])
        if existing_user:
            raise ValueError("Username already registered")
    
    if "email" in update_data and update_data["email"] != db_user.email:
        existing_user = get_user_by_email(db, email=update_data["email"])
        if existing_user:
            raise ValueError("Email already registered")
    
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> bool:
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    
    db.delete(db_user)
    db.commit()
    return True