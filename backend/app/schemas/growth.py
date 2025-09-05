"""
Growth record schemas for API requests and responses
"""

from typing import Optional, List
from pydantic import BaseModel, validator
from datetime import date, datetime

class GrowthRecordBase(BaseModel):
    """Base growth record schema"""
    measurement_date: date
    weight: float
    height: Optional[float] = None
    head_circumference: Optional[float] = None
    mid_upper_arm_circumference: Optional[float] = None
    notes: Optional[str] = None
    measured_by: Optional[str] = None

    @validator('weight')
    def validate_weight(cls, v):
        if v <= 0 or v > 200:  # 200kg max
            raise ValueError('Weight must be between 0 and 200 kg')
        return v

    @validator('height')
    def validate_height(cls, v):
        if v is not None and (v <= 0 or v > 250):  # 250cm max
            raise ValueError('Height must be between 0 and 250 cm')
        return v

    @validator('head_circumference')
    def validate_head_circumference(cls, v):
        if v is not None and (v <= 0 or v > 80):  # 80cm max
            raise ValueError('Head circumference must be between 0 and 80 cm')
        return v

    @validator('mid_upper_arm_circumference')
    def validate_muac(cls, v):
        if v is not None and (v <= 0 or v > 50):  # 50cm max
            raise ValueError('Mid-upper arm circumference must be between 0 and 50 cm')
        return v

    @validator('measurement_date')
    def validate_measurement_date(cls, v):
        if v > date.today():
            raise ValueError('Measurement date cannot be in the future')
        return v

class GrowthRecordCreate(GrowthRecordBase):
    """Schema for creating a new growth record"""
    child_id: int

class GrowthRecordUpdate(BaseModel):
    """Schema for updating growth record"""
    measurement_date: Optional[date] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    head_circumference: Optional[float] = None
    mid_upper_arm_circumference: Optional[float] = None
    notes: Optional[str] = None
    measured_by: Optional[str] = None

    @validator('weight')
    def validate_weight(cls, v):
        if v is not None and (v <= 0 or v > 200):
            raise ValueError('Weight must be between 0 and 200 kg')
        return v

    @validator('height')
    def validate_height(cls, v):
        if v is not None and (v <= 0 or v > 250):
            raise ValueError('Height must be between 0 and 250 cm')
        return v

class GrowthRecordResponse(GrowthRecordBase):
    """Schema for growth record response"""
    id: int
    child_id: int
    
    # Calculated values
    weight_for_age_zscore: Optional[float] = None
    height_for_age_zscore: Optional[float] = None
    weight_for_height_zscore: Optional[float] = None
    bmi: Optional[float] = None
    
    # Growth status
    weight_status: Optional[str] = None
    height_status: Optional[str] = None
    overall_status: Optional[str] = None
    
    # Child age at measurement
    age_months_at_measurement: Optional[int] = None
    
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class GrowthRecordList(BaseModel):
    """Schema for growth record list response"""
    records: List[GrowthRecordResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

class GrowthRecordSummary(BaseModel):
    """Schema for growth record summary"""
    id: int
    child_id: int
    measurement_date: date
    weight: float
    height: Optional[float] = None
    bmi: Optional[float] = None
    overall_status: Optional[str] = None
    age_months_at_measurement: Optional[int] = None

    class Config:
        from_attributes = True

class GrowthTrend(BaseModel):
    """Schema for growth trend analysis"""
    child_id: int
    measurement_period_months: int
    weight_trend: str  # "increasing", "decreasing", "stable", "insufficient_data"
    height_trend: Optional[str] = None
    latest_weight: float
    latest_height: Optional[float] = None
    weight_change_kg: Optional[float] = None
    height_change_cm: Optional[float] = None
    measurements_count: int
    risk_level: str  # "low", "medium", "high", "critical"
    recommendations: List[str]

class GrowthChart(BaseModel):
    """Schema for growth chart data"""
    child_id: int
    measurements: List[GrowthRecordSummary]
    weight_percentiles: Optional[dict] = None
    height_percentiles: Optional[dict] = None
    who_standards: Optional[dict] = None

class GrowthSearch(BaseModel):
    """Schema for growth record search parameters"""
    child_id: Optional[int] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    weight_min: Optional[float] = None
    weight_max: Optional[float] = None
    height_min: Optional[float] = None
    height_max: Optional[float] = None
    overall_status: Optional[str] = None
    measured_by: Optional[str] = None
    page: int = 1
    per_page: int = 20

    @validator('per_page')
    def validate_per_page(cls, v):
        if v < 1 or v > 100:
            raise ValueError('per_page must be between 1 and 100')
        return v

    @validator('date_from', 'date_to')
    def validate_dates(cls, v):
        if v is not None and v > date.today():
            raise ValueError('Date cannot be in the future')
        return v

class ChildGrowthStats(BaseModel):
    """Schema for child growth statistics"""
    child_id: int
    total_measurements: int
    first_measurement_date: Optional[date] = None
    latest_measurement_date: Optional[date] = None
    current_weight: Optional[float] = None
    current_height: Optional[float] = None
    current_bmi: Optional[float] = None
    current_status: Optional[str] = None
    weight_gain_kg: Optional[float] = None
    height_gain_cm: Optional[float] = None
    measurement_frequency_days: Optional[float] = None
    growth_velocity: Optional[dict] = None  # weight/height velocity per month
