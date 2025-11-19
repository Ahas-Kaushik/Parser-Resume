"""
Application Configuration
Loads settings from environment variables
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "AI-Powered Job Portal"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Security
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_DAYS: int = 7
    
    # Database
    DATABASE_URL: str = "sqlite:///./app.db"
    
    # File Upload
    UPLOAD_DIR: str = "./storage"
    MAX_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_EXTENSIONS: str = "pdf,docx,txt"
    
    # Email
    EMAIL_ENABLED: bool = False
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@jobportal.com"
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    # Chat
    CHAT_MESSAGE_LIMIT: int = 100
    CHAT_HISTORY_DAYS: int = 30
    
    # Resume Screening
    DEFAULT_SIMILARITY_THRESHOLD: float = 0.6
    DEFAULT_MIN_SCORE: float = 70.0
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse ALLOWED_ORIGINS string into list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    @property
    def allowed_extensions_list(self) -> List[str]:
        """Parse ALLOWED_EXTENSIONS string into list"""
        return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(",")]


# Create settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)