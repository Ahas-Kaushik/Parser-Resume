"""
Application Schemas
Pydantic models for application validation
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class ApplicationStatus(str, Enum):
    """Application status enumeration"""
    PENDING = "pending"
    SELECTED = "selected"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class ApplicationCreate(BaseModel):
    """Application creation schema (multipart form)"""
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=15)
    current_company: Optional[str] = None
    current_position: Optional[str] = None
    current_salary: Optional[float] = None
    # resume file is handled separately in the endpoint


class ApplicationResponse(BaseModel):
    """Application response schema"""
    id: int
    job_id: int
    candidate_id: int
    name: str
    phone: str
    current_company: Optional[str] = None
    current_position: Optional[str] = None
    current_salary: Optional[float] = None
    resume_path: str
    status: ApplicationStatus
    score: Optional[float] = None
    explanation: Optional[Dict[str, Any]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ApplicationListResponse(BaseModel):
    """List of applications with job details"""
    id: int
    job_id: int
    job_title: str
    company: str
    status: ApplicationStatus
    score: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True