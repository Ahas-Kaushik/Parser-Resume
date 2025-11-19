"""
Dependencies
Common dependencies for route handlers (authentication, etc.)
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.config import settings
from app.database import get_db
from app.models.user import User

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def create_access_token(data: dict) -> str:
    """
    Create JWT access token
    
    Args:
        data: Dictionary containing user data to encode
    
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.JWT_EXPIRATION_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def verify_token(token: str) -> dict:
    """
    Verify and decode JWT token
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded token payload
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from token
    
    Args:
        token: JWT token from request header
        db: Database session
    
    Returns:
        User object
    
    Raises:
        HTTPException: If user not found or token invalid
    """
    payload = verify_token(token)
    user_id: int = payload.get("sub")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_employer(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Ensure current user is an employer
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        User object if employer
    
    Raises:
        HTTPException: If user is not an employer
    """
    if current_user.role != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can access this resource"
        )
    return current_user


async def get_current_candidate(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Ensure current user is a candidate
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        User object if candidate
    
    Raises:
        HTTPException: If user is not a candidate
    """
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can access this resource"
        )
    return current_user