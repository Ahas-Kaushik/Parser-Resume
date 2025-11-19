"""
Authentication Router
Handles user registration, login, and profile
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.dependencies import create_access_token, get_current_user
from app.utils.security import hash_password, verify_password

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user (candidate or employer)
    
    - **name**: User's full name
    - **email**: Valid email address (must be unique)
    - **phone**: Phone number (optional)
    - **role**: Either 'candidate' or 'employer'
    - **password**: Strong password (min 6 characters)
    - **password_confirm**: Must match password
    """
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create new user
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        role=user_data.role,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login and receive JWT token
    
    - **email**: Registered email address
    - **password**: User's password
    
    Returns JWT token and user information
    """
    
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create JWT token
    access_token = create_access_token(
        data={
            "sub": user.id,
            "email": user.email,
            "role": user.role.value
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information
    
    Requires valid JWT token in Authorization header
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_profile(
    name: str = None,
    phone: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user profile
    
    - **name**: New name (optional)
    - **phone**: New phone number (optional)
    """
    
    if name:
        current_user.name = name
    if phone:
        current_user.phone = phone
    
    db.commit()
    db.refresh(current_user)
    
    return current_user