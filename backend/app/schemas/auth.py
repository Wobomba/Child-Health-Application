"""
Authentication schemas
"""

from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Optional[dict] = None  # UserResponse dict
    # Legacy fields for backward compatibility
    user_id: Optional[int] = None
    username: Optional[str] = None
    role: Optional[str] = None
    is_first_login: Optional[bool] = False  # Indicates if this is the first login

class TokenData(BaseModel):
    """Token payload data"""
    username: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    """User login request"""
    username: str
    password: str

class UserCreate(BaseModel):
    """User creation request"""
    username: str
    email: EmailStr
    full_name: str
    password: str
    role: str = "vht"
    village: Optional[str] = None
    district: Optional[str] = None

class UserUpdate(BaseModel):
    """User update request"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None

class UserResponse(BaseModel):
    """User response model"""
    id: int
    username: str
    email: str
    full_name: str
    role: str
    village: Optional[str] = None
    district: Optional[str] = None
    is_active: bool
    is_verified: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserPasswordChange(BaseModel):
    """Password change request"""
    current_password: str
    new_password: str

class UserPasswordReset(BaseModel):
    """Password reset request"""
    email: EmailStr

class UserPasswordResetConfirm(BaseModel):
    """Password reset confirmation"""
    token: str
    new_password: str
