
"""
Assessment model for storing comprehensive health assessments
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float, Boolean, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    assessor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vht_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # For backward compatibility
    
    # Assessment details
    assessment_date = Column(Date, nullable=False)
    assessment_type = Column(String(50), nullable=False)  # routine, follow_up, emergency
    location = Column(String(200), nullable=True)
    
    # Clinical findings
    chief_complaint = Column(Text, nullable=True)
    history_of_present_illness = Column(Text, nullable=True)
    past_medical_history = Column(Text, nullable=True)
    family_history = Column(Text, nullable=True)
    
    # Physical examination
    general_appearance = Column(String(100), nullable=True)
    vital_signs = Column(Text, nullable=True)  # JSON string
    skin_examination = Column(Text, nullable=True)
    head_neck_examination = Column(Text, nullable=True)
    chest_examination = Column(Text, nullable=True)
    abdominal_examination = Column(Text, nullable=True)
    musculoskeletal_examination = Column(Text, nullable=True)
    
    # New examination fields (from schema)
    skin_condition = Column(Text, nullable=True)
    eye_condition = Column(Text, nullable=True)
    ear_condition = Column(Text, nullable=True)
    nose_condition = Column(Text, nullable=True)
    throat_condition = Column(Text, nullable=True)
    chest_condition = Column(Text, nullable=True)
    abdomen_condition = Column(Text, nullable=True)
    neurological_condition = Column(Text, nullable=True)
    musculoskeletal_condition = Column(Text, nullable=True)
    
    # Growth assessment
    current_weight = Column(Float, nullable=True)  # in kg
    current_height = Column(Float, nullable=True)  # in cm
    weight_for_age_percentile = Column(Float, nullable=True)
    height_for_age_percentile = Column(Float, nullable=True)
    weight_for_height_percentile = Column(Float, nullable=True)
    
    # New measurement fields (from schema)
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    head_circumference_cm = Column(Float, nullable=True)
    muac_cm = Column(Float, nullable=True)
    temperature_celsius = Column(Float, nullable=True)
    blood_pressure_systolic = Column(Integer, nullable=True)
    blood_pressure_diastolic = Column(Integer, nullable=True)
    heart_rate_bpm = Column(Integer, nullable=True)
    respiratory_rate = Column(Integer, nullable=True)
    oxygen_saturation = Column(Integer, nullable=True)
    
    # Nutrition assessment
    feeding_history = Column(Text, nullable=True)
    dietary_restrictions = Column(Text, nullable=True)
    appetite_changes = Column(String(100), nullable=True)
    food_allergies = Column(Text, nullable=True)
    
    # New history fields (from schema)
    developmental_milestones = Column(Text, nullable=True)
    immunization_status = Column(Text, nullable=True)
    sleep_patterns = Column(Text, nullable=True)
    behavioral_notes = Column(Text, nullable=True)
    social_history = Column(Text, nullable=True)
    environmental_factors = Column(Text, nullable=True)
    history_present_illness = Column(Text, nullable=True)
    review_of_systems = Column(Text, nullable=True)
    physical_examination = Column(Text, nullable=True)
    assessment_notes = Column(Text, nullable=True)
    
    # AI analysis integration
    ai_malnutrition_score = Column(Float, nullable=True)
    ai_confidence_level = Column(Float, nullable=True)
    ai_recommendations = Column(Text, nullable=True)
    ai_analysis_id = Column(Integer, nullable=True)  # New from schema
    ai_confidence_score = Column(Float, nullable=True)  # New from schema
    ai_risk_indicators = Column(Text, nullable=True)  # JSON string, new from schema
    
    # Clinical diagnosis
    primary_diagnosis = Column(String(200), nullable=True)
    secondary_diagnosis = Column(Text, nullable=True)
    differential_diagnosis = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=True)  # New from schema
    
    # Treatment plan
    treatment_recommendations = Column(Text, nullable=True)
    treatment_plan = Column(Text, nullable=True)  # New from schema
    medications_prescribed = Column(Text, nullable=True)
    follow_up_plan = Column(Text, nullable=True)
    follow_up_instructions = Column(Text, nullable=True)  # New from schema
    referral_needed = Column(Boolean, default=False)
    referral_required = Column(Boolean, default=False)  # New from schema
    referral_details = Column(Text, nullable=True)
    
    # Risk assessment
    risk_level = Column(String(20), nullable=True)  # low, medium, high, critical
    risk_factors = Column(Text, nullable=True)
    
    # Status
    assessment_status = Column(String(20), default="draft")  # draft, completed, reviewed
    status = Column(String(20), default="pending")  # New from schema: pending, in_progress, completed, cancelled
    is_urgent = Column(Boolean, default=False)
    priority_score = Column(Integer, nullable=True)  # New from schema
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    child = relationship("Child", back_populates="assessments")
    assessor = relationship("User", back_populates="assessments", foreign_keys=[assessor_id])
    
    def __repr__(self):
        return f"<Assessment(id={self.id}, child_id={self.child_id}, date='{self.assessment_date}')>"
    
    @property
    def is_critical(self):
        """Determine if assessment indicates critical condition"""
        return self.risk_level == "critical" or self.is_urgent
    
    @property
    def needs_immediate_attention(self):
        """Determine if assessment needs immediate attention"""
        return self.is_urgent or self.risk_level in ["high", "critical"]
