"""
Pydantic schemas for request/response models
"""

from .auth import Token, TokenData, UserLogin, UserCreate, UserUpdate, UserResponse
from .child import ChildCreate, ChildUpdate, ChildResponse, ChildList, ChildSummary, ChildSearch
from .growth import (
    GrowthRecordCreate, GrowthRecordUpdate, GrowthRecordResponse, 
    GrowthRecordList, GrowthSearch, GrowthTrend, ChildGrowthStats
)
from .photo import (
    PhotoType, AnalysisStatus, PhotoUpload, PhotoResponse, PhotoList,
    PhotoUpdate, PhotoSearch, AIAnalysisRequest, AIAnalysisResponse,
    PhotoSummary, BulkPhotoUpload, PhotoAnalyticsTrend, PhotoAnalytics
)

__all__ = [
    "Token",
    "TokenData", 
    "UserLogin",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "ChildCreate",
    "ChildUpdate",
    "ChildResponse",
    "ChildList",
    "ChildSummary",
    "ChildSearch",
    "GrowthRecordCreate",
    "GrowthRecordUpdate",
    "GrowthRecordResponse",
    "GrowthRecordList",
    "GrowthSearch",
    "GrowthTrend",
    "ChildGrowthStats",
    "PhotoType",
    "AnalysisStatus",
    "PhotoUpload",
    "PhotoResponse",
    "PhotoList",
    "PhotoUpdate",
    "PhotoSearch",
    "AIAnalysisRequest",
    "AIAnalysisResponse",
    "PhotoSummary",
    "BulkPhotoUpload",
    "PhotoAnalyticsTrend",
    "PhotoAnalytics"
]
