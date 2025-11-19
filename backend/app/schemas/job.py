"""
Job Schemas
Pydantic models for job validation
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class JobRules(BaseModel):
    """Resume screening rules for a job"""
    version: str = "v1"
    role: Optional[str] = None
    required_all: Optional[List[str]] = []
    required_any: Optional[List[str]] = []
    any_min: int = 0
    min_years: int = 0
    forbidden_keywords: Optional[List[str]] = []
    similarity_threshold: Optional[float] = 0.6
    allowed_degrees: Optional[List[str]] = []
    min_degree_level: Optional[str] = None
    allowed_locations: Optional[List[str]] = []
    allow_remote: bool = True
    require_work_auth: bool = False
    scoring: Optional[Dict[str, Any]] = {
        "enabled": True,
        "threshold": 70.0,
        "weights": {
            "skills_all": 30.0,
            "skills_any": 20.0,
            "experience": 20.0,
            "similarity": 25.0,
            "degree": 5.0
        }
    }


class JobBase(BaseModel):
    """Base job schema"""
    title: str = Field(..., min_length=3, max_length=200)
    company: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    employment_type: Optional[str] = "full-time"


class JobCreate(JobBase):
    """Job creation schema"""
    rules: Optional[JobRules] = None


class JobUpdate(BaseModel):
    """Job update schema"""
    title: Optional[str] = None
    company: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    employment_type: Optional[str] = None
    rules: Optional[JobRules] = None
    is_active: Optional[bool] = None


class JobResponse(JobBase):
    """Job response schema"""
    id: int
    employer_id: int
    is_active: bool
    created_at: datetime
    rules: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


class JobStats(BaseModel):
    """Job statistics schema"""
    job_id: int
    total_applications: int
    selected_count: int
    rejected_count: int
    pending_count: int
    avg_score: Optional[float] = None
    top_skills: List[str] = []