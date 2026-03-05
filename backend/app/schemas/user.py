"""
User Schemas
Pydantic models for user validation
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum


# ── Keep this here — do NOT import from models (causes circular import) ──
class UserRole(str, Enum):
    """User role enumeration"""
    CANDIDATE = "candidate"
    EMPLOYER = "employer"


class UserBase(BaseModel):
    """Base user schema"""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole


class UserCreate(UserBase):
    """User creation schema"""
    password: str = Field(..., min_length=6, max_length=50)
    password_confirm: str

    @validator('password')
    def password_strength(cls, v):
        """Validate password strength"""
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        if len(v) > 50:
            raise ValueError('Password must be less than 50 characters')
        return v


class UserLogin(BaseModel):
    """User login schema"""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """User response schema"""
    id: int
    created_at: Optional[datetime] = None   # Optional — OAuth users may not have it yet

    # OAuth fields — Optional so normal email users work fine
    avatar_url: Optional[str] = None
    oauth_provider: Optional[str] = None
    is_active: Optional[bool] = True

    class Config:
        from_attributes = True


class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Token payload data"""
    sub: int
    email: str
    role: str