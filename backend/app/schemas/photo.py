"""
Photo-related Pydantic schemas for request/response validation
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator
from enum import Enum


class PhotoType(str, Enum):
    """Types of photos that can be uploaded"""
    FACE = "face"
    FULL_BODY = "full_body"
    CLINICAL = "clinical"
    GROWTH_CHART = "growth_chart"
    OTHER = "other"


class AnalysisStatus(str, Enum):
    """Status of AI analysis"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class PhotoUpload(BaseModel):
    """Schema for photo upload request"""
    child_id: int = Field(..., description="ID of the child")
    photo_type: PhotoType = Field(default=PhotoType.FACE, description="Type of photo")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes about the photo")
    
    class Config:
        use_enum_values = True


class PhotoResponse(BaseModel):
    """Schema for photo response"""
    id: int
    child_id: int
    filename: str
    file_path: str
    file_size: int
    mime_type: str
    photo_type: PhotoType
    taken_date: datetime
    uploaded_by: int
    
    # AI Analysis fields
    malnutrition_score: Optional[float] = None
    confidence_level: Optional[float] = None
    analysis_status: AnalysisStatus
    detected_features: Optional[Dict[str, Any]] = None
    recommendations: Optional[List[str]] = None
    analysis_notes: Optional[str] = None
    is_analyzed: bool = False
    is_flagged: bool = False
    flag_reason: Optional[str] = None
    
    # Metadata
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Computed properties
    file_size_mb: Optional[float] = None
    is_malnourished: Optional[bool] = None
    
    class Config:
        from_attributes = True
        use_enum_values = True


class PhotoList(BaseModel):
    """Schema for paginated photo list response"""
    photos: List[PhotoResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
    
    class Config:
        from_attributes = True


class PhotoUpdate(BaseModel):
    """Schema for updating photo metadata"""
    photo_type: Optional[PhotoType] = None
    notes: Optional[str] = Field(None, max_length=500)
    is_flagged: Optional[bool] = None
    flag_reason: Optional[str] = Field(None, max_length=200)
    
    class Config:
        use_enum_values = True


class PhotoSearch(BaseModel):
    """Schema for photo search parameters"""
    child_id: Optional[int] = None
    photo_type: Optional[PhotoType] = None
    analysis_status: Optional[AnalysisStatus] = None
    is_flagged: Optional[bool] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    has_analysis: Optional[bool] = None
    uploaded_by: Optional[int] = None
    
    # Pagination
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)
    
    class Config:
        use_enum_values = True


class AIAnalysisRequest(BaseModel):
    """Schema for requesting AI analysis"""
    photo_id: int = Field(..., description="ID of the photo to analyze")
    force_reanalysis: bool = Field(default=False, description="Force re-analysis even if already analyzed")
    analysis_type: str = Field(default="malnutrition", description="Type of analysis to perform")


class AIAnalysisResponse(BaseModel):
    """Schema for AI analysis results"""
    photo_id: int
    analysis_status: AnalysisStatus
    malnutrition_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="Risk score between 0-1")
    confidence_level: Optional[float] = Field(None, ge=0.0, le=1.0, description="Confidence in analysis")
    detected_features: Optional[Dict[str, Any]] = None
    recommendations: Optional[List[str]] = None
    analysis_notes: Optional[str] = None
    is_malnourished: Optional[bool] = None
    processing_time_seconds: Optional[float] = None
    model_version: Optional[str] = None
    analyzed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        use_enum_values = True


class PhotoSummary(BaseModel):
    """Schema for photo summary statistics"""
    total_photos: int
    photos_by_type: Dict[str, int]
    photos_by_status: Dict[str, int]
    analyzed_photos: int
    flagged_photos: int
    avg_malnutrition_score: Optional[float] = None
    recent_uploads: int  # Last 7 days
    
    class Config:
        from_attributes = True


class BulkPhotoUpload(BaseModel):
    """Schema for bulk photo upload request"""
    child_id: int
    photo_details: List[Dict[str, Any]] = Field(..., description="List of photo metadata")
    
    class Config:
        from_attributes = True


class PhotoAnalyticsTrend(BaseModel):
    """Schema for photo analytics trends"""
    date: datetime
    uploads_count: int
    analysis_count: int
    malnutrition_detections: int
    avg_confidence: Optional[float] = None
    
    class Config:
        from_attributes = True


class PhotoAnalytics(BaseModel):
    """Schema for comprehensive photo analytics"""
    summary: PhotoSummary
    trends: List[PhotoAnalyticsTrend]
    top_uploaders: List[Dict[str, Any]]
    analysis_performance: Dict[str, Any]
    
    class Config:
        from_attributes = True
