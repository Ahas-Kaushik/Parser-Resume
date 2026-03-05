"""
User Model
Stores user information for both candidates and employers
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base


# ── Defined here independently — same values as schemas/user.py ──
class UserRole(str, enum.Enum):
    """User role enumeration"""
    CANDIDATE = "candidate"
    EMPLOYER = "employer"


class OAuthProvider(str, enum.Enum):
    """OAuth provider enumeration"""
    local = "local"
    google = "google"
    github = "github"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)

    # nullable=True — OAuth users have no password
    hashed_password = Column(String, nullable=True)

    role = Column(Enum(UserRole), nullable=False, default=UserRole.CANDIDATE)
    is_active = Column(Boolean, default=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # OAuth columns
    oauth_provider = Column(Enum(OAuthProvider), nullable=True, default=OAuthProvider.local)
    oauth_provider_id = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)

    # ALL original relationships
    jobs = relationship("Job", back_populates="employer", foreign_keys="Job.employer_id")
    applications = relationship("Application", back_populates="candidate", foreign_keys="Application.candidate_id")
    sent_messages = relationship("ChatMessage", back_populates="sender", foreign_keys="ChatMessage.sender_id")
    received_messages = relationship("ChatMessage", back_populates="receiver", foreign_keys="ChatMessage.receiver_id")

    # Notifications relationship
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"