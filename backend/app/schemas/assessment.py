from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class AssessmentStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class RiskLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"

class AssessmentType(str, Enum):
    ROUTINE = "routine"
    FOLLOW_UP = "follow_up"
    EMERGENCY = "emergency"
    SCREENING = "screening"

class HealthAssessmentBase(BaseModel):
    child_id: int
    vht_user_id: int
    assessment_type: AssessmentType
    assessment_date: datetime
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    head_circumference_cm: Optional[float] = None
    muac_cm: Optional[float] = None
    temperature_celsius: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate_bpm: Optional[int] = None
    respiratory_rate: Optional[int] = None
    oxygen_saturation: Optional[int] = None
    general_appearance: Optional[str] = None
    skin_condition: Optional[str] = None
    eye_condition: Optional[str] = None
    ear_condition: Optional[str] = None
    nose_condition: Optional[str] = None
    throat_condition: Optional[str] = None
    chest_condition: Optional[str] = None
    abdomen_condition: Optional[str] = None
    neurological_condition: Optional[str] = None
    musculoskeletal_condition: Optional[str] = None
    developmental_milestones: Optional[str] = None
    immunization_status: Optional[str] = None
    feeding_history: Optional[str] = None
    sleep_patterns: Optional[str] = None
    behavioral_notes: Optional[str] = None
    family_history: Optional[str] = None
    social_history: Optional[str] = None
    environmental_factors: Optional[str] = None
    chief_complaint: Optional[str] = None
    history_present_illness: Optional[str] = None
    review_of_systems: Optional[str] = None
    physical_examination: Optional[str] = None
    assessment_notes: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    follow_up_instructions: Optional[str] = None
    referral_required: bool = False
    referral_details: Optional[str] = None
    risk_level: Optional[RiskLevel] = None
    priority_score: Optional[int] = None
    ai_analysis_id: Optional[int] = None
    ai_confidence_score: Optional[float] = None
    ai_risk_indicators: Optional[Dict[str, Any]] = None
    ai_recommendations: Optional[str] = None
    status: AssessmentStatus = AssessmentStatus.PENDING
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class HealthAssessmentCreate(HealthAssessmentBase):
    pass

class HealthAssessmentUpdate(BaseModel):
    assessment_type: Optional[AssessmentType] = None
    assessment_date: Optional[datetime] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    head_circumference_cm: Optional[float] = None
    muac_cm: Optional[float] = None
    temperature_celsius: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate_bpm: Optional[int] = None
    respiratory_rate: Optional[int] = None
    oxygen_saturation: Optional[int] = None
    general_appearance: Optional[str] = None
    skin_condition: Optional[str] = None
    eye_condition: Optional[str] = None
    ear_condition: Optional[str] = None
    nose_condition: Optional[str] = None
    throat_condition: Optional[str] = None
    chest_condition: Optional[str] = None
    abdomen_condition: Optional[str] = None
    neurological_condition: Optional[str] = None
    musculoskeletal_condition: Optional[str] = None
    developmental_milestones: Optional[str] = None
    immunization_status: Optional[str] = None
    feeding_history: Optional[str] = None
    sleep_patterns: Optional[str] = None
    behavioral_notes: Optional[str] = None
    family_history: Optional[str] = None
    social_history: Optional[str] = None
    environmental_factors: Optional[str] = None
    chief_complaint: Optional[str] = None
    history_present_illness: Optional[str] = None
    review_of_systems: Optional[str] = None
    physical_examination: Optional[str] = None
    assessment_notes: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    follow_up_instructions: Optional[str] = None
    referral_required: Optional[bool] = None
    referral_details: Optional[str] = None
    risk_level: Optional[RiskLevel] = None
    priority_score: Optional[int] = None
    ai_analysis_id: Optional[int] = None
    ai_confidence_score: Optional[float] = None
    ai_risk_indicators: Optional[Dict[str, Any]] = None
    ai_recommendations: Optional[str] = None
    status: Optional[AssessmentStatus] = None

class HealthAssessment(HealthAssessmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class HealthAssessmentResponse(BaseModel):
    id: int
    child_id: int
    vht_user_id: int
    assessment_type: AssessmentType
    assessment_date: datetime
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    head_circumference_cm: Optional[float] = None
    muac_cm: Optional[float] = None
    temperature_celsius: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate_bpm: Optional[int] = None
    respiratory_rate: Optional[int] = None
    oxygen_saturation: Optional[int] = None
    general_appearance: Optional[str] = None
    skin_condition: Optional[str] = None
    eye_condition: Optional[str] = None
    ear_condition: Optional[str] = None
    nose_condition: Optional[str] = None
    throat_condition: Optional[str] = None
    chest_condition: Optional[str] = None
    abdomen_condition: Optional[str] = None
    neurological_condition: Optional[str] = None
    musculoskeletal_condition: Optional[str] = None
    developmental_milestones: Optional[str] = None
    immunization_status: Optional[str] = None
    feeding_history: Optional[str] = None
    sleep_patterns: Optional[str] = None
    behavioral_notes: Optional[str] = None
    family_history: Optional[str] = None
    social_history: Optional[str] = None
    environmental_factors: Optional[str] = None
    chief_complaint: Optional[str] = None
    history_present_illness: Optional[str] = None
    review_of_systems: Optional[str] = None
    physical_examination: Optional[str] = None
    assessment_notes: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    follow_up_instructions: Optional[str] = None
    referral_required: bool = False
    referral_details: Optional[str] = None
    risk_level: Optional[RiskLevel] = None
    priority_score: Optional[int] = None
    ai_analysis_id: Optional[int] = None
    ai_confidence_score: Optional[float] = None
    ai_risk_indicators: Optional[Dict[str, Any]] = None
    ai_recommendations: Optional[str] = None
    status: AssessmentStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
