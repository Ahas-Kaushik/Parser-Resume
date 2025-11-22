"""
Job and Application Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class ApplicationStatus(str, Enum):
    """Application status enum"""
    PENDING = "pending"
    SELECTED = "selected"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


# ========================================
# EDUCATION CONFIGURATION SCHEMAS
# ========================================

class GradeConfig(BaseModel):
    """Grade configuration"""
    required: bool = False
    type: str = "percentage"  # cgpa_10, percentage, gpa_4
    value: float = 0.0
    normalized: float = 0.0  # Always stored as percentage


class MinimumQualificationConfig(BaseModel):
    """Minimum qualification configuration"""
    level: str = "12th_diploma"  # 10th, 12th_diploma, bachelor, master, phd
    grade: Optional[GradeConfig] = None


class DegreeRequirementConfig(BaseModel):
    """Degree requirement configuration"""
    enabled: bool = False
    level: str = "bachelor"  # bachelor, master, phd
    fields: List[str] = []
    accept_related_fields: bool = True
    grade: Optional[GradeConfig] = None


class ExperienceSubstituteConfig(BaseModel):
    """Experience substitute configuration"""
    enabled: bool = False
    years_required: int = 5


class AlternativePathsConfig(BaseModel):
    """Alternative paths configuration"""
    experience_substitute: Optional[ExperienceSubstituteConfig] = None


class EducationRequirements(BaseModel):
    """Education requirements configuration"""
    enabled: bool = False
    minimum_qualification: Optional[MinimumQualificationConfig] = None
    degree_requirement: Optional[DegreeRequirementConfig] = None
    alternative_paths: Optional[AlternativePathsConfig] = None


# ========================================
# JOB RULES SCHEMA
# ========================================

class JobRules(BaseModel):
    """Resume screening rules for a job - ENHANCED"""
    version: str = "v2"
    role: Optional[str] = None
    
    # Skills
    required_all: Optional[List[str]] = []
    required_any: Optional[List[str]] = []
    any_min: int = 0
    
    # Experience
    min_years: int = 0
    
    # Other
    forbidden_keywords: Optional[List[str]] = []
    similarity_threshold: Optional[float] = 0.3
    
    # NEW: Education Requirements
    education_requirements: Optional[EducationRequirements] = None
    
    # Location & Authorization (Legacy - kept for backwards compatibility)
    allowed_degrees: Optional[List[str]] = []
    min_degree_level: Optional[str] = None
    allowed_locations: Optional[List[str]] = []
    allow_remote: bool = True
    require_work_auth: bool = False
    
    # Scoring
    scoring: Optional[Dict[str, Any]] = {
        "enabled": True,
        "threshold": 50.0,
        "weights": {
            "skills_all": 25.0,
            "skills_any": 15.0,
            "experience": 15.0,
            "similarity": 20.0,
            "education": 25.0
        }
    }


# ========================================
# JOB CRUD SCHEMAS
# ========================================

class JobCreate(BaseModel):
    """Schema for creating a job"""
    title: str = Field(..., min_length=1, max_length=200)
    company: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    employment_type: Optional[str] = "full-time"
    rules: Optional[JobRules] = None


class JobUpdate(BaseModel):
    """Schema for updating a job"""
    title: Optional[str] = None
    company: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    employment_type: Optional[str] = None
    is_active: Optional[bool] = None
    rules: Optional[JobRules] = None


class JobResponse(BaseModel):
    """Schema for job response"""
    id: int
    title: str
    company: str
    description: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    employment_type: Optional[str] = None
    employer_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    rules: Optional[JobRules] = None

    class Config:
        from_attributes = True


class JobStats(BaseModel):
    """Job statistics"""
    job_id: int
    total_applications: int
    selected_count: int
    rejected_count: int
    pending_count: int
    avg_score: Optional[float] = None
    top_skills: List[str] = []