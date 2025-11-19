"""
Application Model
Stores job applications submitted by candidates
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class ApplicationStatus(str, enum.Enum):
    """Application status enumeration"""
    PENDING = "pending"
    SELECTED = "selected"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Application Data
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    current_company = Column(String, nullable=True)
    current_position = Column(String, nullable=True)
    current_salary = Column(Float, nullable=True)
    
    # Resume
    resume_path = Column(String, nullable=False)
    
    # AI Screening Results
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.PENDING)
    score = Column(Float, nullable=True)
    explanation = Column(JSON, nullable=True)  # Detailed AI screening explanation
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    job = relationship("Job", back_populates="applications")
    candidate = relationship("User", back_populates="applications", foreign_keys=[candidate_id])

    def __repr__(self):
        return f"<Application(id={self.id}, job_id={self.job_id}, status={self.status}, score={self.score})>"