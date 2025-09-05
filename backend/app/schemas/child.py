"""
Child schemas for API requests and responses
"""

from typing import Optional, List
from pydantic import BaseModel, validator
from datetime import date, datetime

class ChildBase(BaseModel):
    """Base child schema"""
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    village: str
    district: str
    parent_name: str
    parent_phone: Optional[str] = None
    parent_address: Optional[str] = None
    birth_weight: Optional[float] = None
    has_disabilities: bool = False
    disability_details: Optional[str] = None

    @validator('gender')
    def validate_gender(cls, v):
        if v.lower() not in ['male', 'female']:
            raise ValueError('Gender must be either "male" or "female"')
        return v.lower()

    @validator('date_of_birth')
    def validate_date_of_birth(cls, v):
        if v > date.today():
            raise ValueError('Date of birth cannot be in the future')
        # Check if child is older than 18 years (unusual for VHT program)
        age_years = (date.today() - v).days / 365.25
        if age_years > 18:
            raise ValueError('Child cannot be older than 18 years')
        return v

    @validator('birth_weight')
    def validate_birth_weight(cls, v):
        if v is not None and (v < 0.5 or v > 10.0):
            raise ValueError('Birth weight must be between 0.5kg and 10.0kg')
        return v

class ChildCreate(ChildBase):
    """Schema for creating a new child"""
    unique_id: Optional[str] = None  # Will be auto-generated if not provided

class ChildUpdate(BaseModel):
    """Schema for updating child information"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_address: Optional[str] = None
    birth_weight: Optional[float] = None
    has_disabilities: Optional[bool] = None
    disability_details: Optional[str] = None
    is_active: Optional[bool] = None

    @validator('gender')
    def validate_gender(cls, v):
        if v is not None and v.lower() not in ['male', 'female']:
            raise ValueError('Gender must be either "male" or "female"')
        return v.lower() if v else v

    @validator('date_of_birth')
    def validate_date_of_birth(cls, v):
        if v is not None and v > date.today():
            raise ValueError('Date of birth cannot be in the future')
        return v

class ChildResponse(ChildBase):
    """Schema for child response"""
    id: int
    unique_id: str
    vht_user_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Computed fields
    age_months: Optional[int] = None

    class Config:
        from_attributes = True

class ChildList(BaseModel):
    """Schema for child list response"""
    children: List[ChildResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

class ChildSummary(BaseModel):
    """Schema for child summary (lighter response)"""
    id: int
    unique_id: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    village: str
    district: str
    age_months: Optional[int] = None
    is_active: bool

    class Config:
        from_attributes = True

class ChildSearch(BaseModel):
    """Schema for child search parameters"""
    query: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    gender: Optional[str] = None
    age_min_months: Optional[int] = None
    age_max_months: Optional[int] = None
    has_disabilities: Optional[bool] = None
    is_active: Optional[bool] = True
    page: int = 1
    per_page: int = 20

    @validator('per_page')
    def validate_per_page(cls, v):
        if v < 1 or v > 100:
            raise ValueError('per_page must be between 1 and 100')
        return v
