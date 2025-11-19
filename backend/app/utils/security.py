"""
Security Utilities
Password hashing and verification using bcrypt with length limits
"""

from passlib.context import CryptContext

# Create password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt with 72-byte limit
    
    Args:
        password: Plain text password (max 72 characters)
    
    Returns:
        Hashed password string
    
    Raises:
        ValueError: If password is too long
    """
    # Bcrypt has a 72-byte limit - enforce it
    if len(password.encode('utf-8')) > 72:
        raise ValueError("Password is too long. Please use a password with maximum 50 characters.")
    
    # Truncate to be safe (72 bytes)
    password_truncated = password[:50]  # Keep it under 50 chars to be safe
    
    return pwd_context.hash(password_truncated)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Stored hashed password
    
    Returns:
        True if password matches, False otherwise
    """
    # Truncate to match what was hashed
    password_truncated = plain_password[:50]
    
    try:
        return pwd_context.verify(password_truncated, hashed_password)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False