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
        print(f"🔍 Verifying token: {token[:30]}...")
        
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        print(f"✅ Token decoded successfully:")
        print(f"   - User ID: {payload.get('sub')}")
        print(f"   - Email: {payload.get('email')}")
        print(f"   - Role: {payload.get('role')}")
        print(f"   - Expires: {payload.get('exp')}")
        
        user_id: int = payload.get("sub")
        if user_id is None:
            print("❌ Token missing 'sub' (user_id)")
            raise credentials_exception
            
        return payload
        
    except jwt.ExpiredSignatureError:
        print("❌ Token has expired")
        raise credentials_exception
    except JWTError as e:
        print(f"❌ JWT Error: {e}")
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
    print(f"\n{'='*60}")
    print(f"🔐 get_current_user called")
    print(f"{'='*60}")
    
    payload = verify_token(token)
    user_id: int = payload.get("sub")
    
    print(f"🔍 Looking up user with ID: {user_id}")
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        print(f"❌ User with ID {user_id} not found in database")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"✅ User found:")
    print(f"   - ID: {user.id}")
    print(f"   - Email: {user.email}")
    print(f"   - Role: {user.role}")
    print(f"{'='*60}\n")
    
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
