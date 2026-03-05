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
import logging

logger = logging.getLogger(__name__)

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

    # Convert 'sub' to string if it exists and is an integer
    if 'sub' in to_encode and isinstance(to_encode['sub'], int):
        to_encode['sub'] = str(to_encode['sub'])

    # FIX: Use settings.JWT_EXPIRATION_DAYS which now has a safe default of 7.
    # Previously this could be None, causing timedelta(days=None) -> TypeError crash.
    expire = datetime.utcnow() + timedelta(days=settings.JWT_EXPIRATION_DAYS)
    to_encode.update({"exp": expire})

    # FIX: Use settings.secret_key (property) which raises ValueError if not set,
    # instead of settings.JWT_SECRET which could be None.
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm
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
        # FIX: Removed console.log of token contents — never log tokens in production
        logger.debug("Verifying incoming JWT token")

        # FIX: Use settings.secret_key (raises if missing) instead of settings.JWT_SECRET
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )

        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            logger.warning("Token missing 'sub' claim")
            raise credentials_exception

        # Convert string back to integer
        try:
            payload['sub'] = int(user_id_str)
        except (ValueError, TypeError):
            logger.warning("Invalid user ID format in token 'sub' claim")
            raise credentials_exception

        return payload

    except jwt.ExpiredSignatureError:
        logger.info("Token has expired")
        raise credentials_exception
    except JWTError as e:
        logger.warning(f"JWT validation error: {type(e).__name__}")
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
        logger.warning(f"Token valid but user ID {user_id} not found in database")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_employer(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensure current user is an employer"""
    if current_user.role != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can access this resource"
        )
    return current_user


async def get_current_candidate(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensure current user is a candidate"""
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can access this resource"
        )
    return current_user