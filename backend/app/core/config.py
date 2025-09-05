"""
Configuration settings for AI Child Health application
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Application settings
    app_name: str = "AI Child Health"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Database settings
    database_url: str = "postgresql://postgres:password@localhost:5432/child_health"
    database_test_url: str = "postgresql://postgres:password@localhost:5432/child_health_test"
    
    # Security settings
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # File upload settings
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    upload_dir: str = "uploads"
    allowed_image_types: list = ["image/jpeg", "image/png", "image/jpg"]
    
    # AI/ML Model settings
    model_path: str = "ml_models/malnutrition_detection.h5"
    confidence_threshold: float = 0.7
    
    # CORS settings
    cors_origins: list = ["http://localhost:3000", "http://localhost:8000"]
    
    # Server settings
    host: str = "127.0.0.1"
    port: int = 8000
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Create settings instance
settings = Settings()

# Environment-specific overrides
if os.getenv("ENVIRONMENT") == "production":
    settings.debug = False
    settings.cors_origins = ["https://yourdomain.com"]
elif os.getenv("ENVIRONMENT") == "development":
    settings.debug = True
