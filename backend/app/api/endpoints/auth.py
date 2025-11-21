"""
Authentication endpoints
"""

from datetime import timedelta, datetime
from typing import Any
import secrets
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.config import settings

logger = logging.getLogger(__name__)
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.deps import get_current_user, require_admin
from app.models.user import User
from app.schemas.auth import (
    Token, UserLogin, UserCreate, UserUpdate, UserResponse, 
    UserPasswordChange, UserPasswordReset, UserPasswordResetConfirm
)

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    user_credentials: UserLogin,
    db: Session = Depends(get_db)
) -> Any:
    """User login endpoint"""
    # Find user by username
    user = db.query(User).filter(User.username == user_credentials.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user account",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Track login time and determine if first-time login
    is_first_login = user.last_login is None
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id), "username": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    
    # Return token with user data
    from app.schemas.auth import UserResponse
    user_response = UserResponse.model_validate(user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60,
        "user": user_response.model_dump(),
        "user_id": user.id,  # Legacy support
        "username": user.username,  # Legacy support
        "role": user.role,  # Legacy support
        "is_first_login": is_first_login  # Indicates if this is the first login
    }

@router.post("/login/form", response_model=Token)
async def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """User login endpoint using form data (for Swagger UI)"""
    return await login(
        UserLogin(username=form_data.username, password=form_data.password),
        db
    )

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)) -> Any:
    """User logout endpoint"""
    # In a real application, you might want to blacklist the token
    # For now, we'll just return a success message
    return {"message": "Successfully logged out"}

@router.post("/register/public", response_model=UserResponse)
async def register_public(
    user_data: UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """Public user registration endpoint"""
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    if user_data.email:
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Create new user with default role 'vht' (Village Health Team)
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        role=user_data.role or "vht",  # Default to VHT for public registrations
        village=user_data.village,
        district=user_data.district,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
) -> Any:
    """Register a new user (admin only)"""
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        role=user_data.role,
        village=user_data.village,
        district=user_data.district,
        is_active=True,
        is_verified=False
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)) -> Any:
    """Get current user information"""
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update current user information"""
    # Update user fields
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.post("/change-password")
async def change_password(
    password_data: UserPasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Change current user password"""
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}

@router.post("/refresh")
async def refresh_token(current_user: User = Depends(get_current_user)) -> Any:
    """Refresh access token"""
    # Create new access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(current_user.id), "username": current_user.username, "role": current_user.role},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60,
        "user_id": current_user.id,
        "username": current_user.username,
        "role": current_user.role
    }

@router.post("/reset-password")
async def reset_password_request(
    reset_data: UserPasswordReset,
    db: Session = Depends(get_db)
) -> Any:
    """Request password reset - generates a reset token"""
    # Find user by email
    user = db.query(User).filter(User.email == reset_data.email).first()
    if user:
        # Generate a secure random token
        reset_token = secrets.token_urlsafe(32)
        # Set token expiration (24 hours from now)
        expires_at = datetime.utcnow() + timedelta(hours=24)
        
        # Store token and expiration in database
        user.password_reset_token = reset_token
        user.password_reset_expires = expires_at
        db.commit()
        
        # In a production environment, you would send an email with the token
        # For development, we'll return the token in the response (remove this in production!)
        logger.info(f"Password reset token for {user.email}: {reset_token}")
        
        return {
            "message": "If the email exists, a password reset link has been sent",
            "reset_token": reset_token  # Remove this in production - only for development
        }
    
    # Always return success to prevent email enumeration
    return {"message": "If the email exists, a password reset link has been sent"}

@router.post("/reset-password/confirm")
async def reset_password_confirm(
    reset_confirm: UserPasswordResetConfirm,
    db: Session = Depends(get_db)
) -> Any:
    """Confirm password reset with token"""
    # Find user by reset token
    user = db.query(User).filter(
        User.password_reset_token == reset_confirm.token
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Check if token has expired
    if user.password_reset_expires and user.password_reset_expires < datetime.utcnow():
        # Clear expired token
        user.password_reset_token = None
        user.password_reset_expires = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired. Please request a new one."
        )
    
    # Validate new password
    if len(reset_confirm.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
    
    # Update password and clear reset token
    user.hashed_password = get_password_hash(reset_confirm.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()
    
    return {"message": "Password has been reset successfully. Please login with your new password."}
