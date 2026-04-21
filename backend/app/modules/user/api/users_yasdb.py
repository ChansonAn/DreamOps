"""
User API - YashanDB 版本
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.db.yasdb_pool import get_db
from app.modules.user.schemas.user import User, UserCreate, UserUpdate, PaginatedResponse
from app.modules.user.crud.user_yasdb import (
    get_user, get_user_by_email, get_user_by_username, get_users, get_users_count,
    create_user as crud_create_user,
    update_user as crud_update_user, 
    delete_user as crud_delete_user, 
    verify_password,
    authenticate_user
)
from config.config import settings

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = get_user(db, user_id=int(user_id))
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user = Depends(get_current_user)):
    if not current_user.get('is_active'):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_admin_user(current_user = Depends(get_current_active_user)):
    if not current_user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user


@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db = Depends(get_db)):
    try:
        user = crud_create_user(db=db, user_in=user_in)
        return user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user['id'])},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=User)
async def read_users_me(current_user = Depends(get_current_active_user)):
    return current_user


@router.put("/me", response_model=User)
async def update_users_me(user_in: UserUpdate, current_user = Depends(get_current_active_user), db = Depends(get_db)):
    try:
        user = crud_update_user(db=db, user_id=current_user['id'], user_in=user_in)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=PaginatedResponse[User])
def read_users(skip: int = 0, limit: int = 100, db = Depends(get_db)):
    users = get_users(db, skip=skip, limit=limit)
    total = get_users_count(db)
    page = (skip // limit) + 1 if limit > 0 else 1
    page_size = limit
    
    return PaginatedResponse[User](
        items=users,
        total=total,
        page=page,
        page_size=page_size
    )

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate, db = Depends(get_db), current_user = Depends(get_current_admin_user)):
    try:
        user = crud_create_user(db=db, user_in=user_in)
        return user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{user_id}", response_model=User)
def read_user(user_id: int, db = Depends(get_db)):
    user = get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=User)
def update_user(user_id: int, user_in: UserUpdate, db = Depends(get_db), current_user = Depends(get_current_active_user)):
    # 允许用户编辑自己的信息，或者管理员编辑任何用户
    if user_id != current_user['id'] and not current_user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    try:
        user = crud_update_user(db=db, user_id=user_id, user_in=user_in)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db = Depends(get_db), current_user = Depends(get_current_active_user)):
    # 允许用户删除自己的账户，或者管理员删除任何用户
    if user_id != current_user['id'] and not current_user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    success = crud_delete_user(db=db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return None
