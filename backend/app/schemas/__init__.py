"""
Schemas Package
Export all schemas for easy importing
"""

from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    UserRole
)

from app.schemas.job import (
    JobCreate,
    JobUpdate,
    JobResponse,
    JobStats,
    JobRules,
    EducationRequirements,
    GradeConfig,
    MinimumQualificationConfig,
    DegreeRequirementConfig,
    ExperienceSubstituteConfig,
    AlternativePathsConfig
)

from app.schemas.application import (
    ApplicationResponse,
    ApplicationListResponse,
    ApplicationStatus
)

__all__ = [
    # User schemas
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "Token",
    "UserRole",
    
    # Job schemas
    "JobCreate",
    "JobUpdate",
    "JobResponse",
    "JobStats",
    "JobRules",
    "EducationRequirements",
    "GradeConfig",
    "MinimumQualificationConfig",
    "DegreeRequirementConfig",
    "ExperienceSubstituteConfig",
    "AlternativePathsConfig",
    
    # Application schemas
    "ApplicationResponse",
    "ApplicationListResponse",
    "ApplicationStatus"
]