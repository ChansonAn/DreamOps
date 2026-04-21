from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Generic, TypeVar
from datetime import datetime

T = TypeVar('T')

class UserBase(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    avatar: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=255)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    avatar: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=255)
    password: Optional[str] = Field(None, min_length=6)

class UserInDB(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class User(UserInDB):
    model_config = {
        "from_attributes": True,
        "exclude": {"password_hash"}
    }

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int