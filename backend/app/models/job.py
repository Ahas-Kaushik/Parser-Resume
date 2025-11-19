"""
Job Model
Stores job postings created by employers
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    company = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String, nullable=True)
    salary_range = Column(String, nullable=True)
    employment_type = Column(String, nullable=True)  # full-time, part-time, contract, etc.
    
    # Screening rules stored as JSON
    rules = Column(JSON, nullable=True)
    
    # Foreign Keys
    employer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    employer = relationship("User", back_populates="jobs", foreign_keys=[employer_id])
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Job(id={self.id}, title={self.title}, company={self.company})>"