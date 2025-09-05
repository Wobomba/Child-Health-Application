
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
    
    # Growth assessment
    current_weight = Column(Float, nullable=True)  # in kg
    current_height = Column(Float, nullable=True)  # in cm
    weight_for_age_percentile = Column(Float, nullable=True)
    height_for_age_percentile = Column(Float, nullable=True)
    weight_for_height_percentile = Column(Float, nullable=True)
    
    # Nutrition assessment
    feeding_history = Column(Text, nullable=True)
    dietary_restrictions = Column(Text, nullable=True)
    appetite_changes = Column(String(100), nullable=True)
    food_allergies = Column(Text, nullable=True)
    
    # AI analysis integration
    ai_malnutrition_score = Column(Float, nullable=True)
    ai_confidence_level = Column(Float, nullable=True)
    ai_recommendations = Column(Text, nullable=True)
    
    # Clinical diagnosis
    primary_diagnosis = Column(String(200), nullable=True)
    secondary_diagnosis = Column(Text, nullable=True)
    differential_diagnosis = Column(Text, nullable=True)
    
    # Treatment plan
    treatment_recommendations = Column(Text, nullable=True)
    medications_prescribed = Column(Text, nullable=True)
    follow_up_plan = Column(Text, nullable=True)
    referral_needed = Column(Boolean, default=False)
    referral_details = Column(Text, nullable=True)
    
    # Risk assessment
    risk_level = Column(String(20), nullable=True)  # low, medium, high, critical
    risk_factors = Column(Text, nullable=True)
    
    # Status
    assessment_status = Column(String(20), default="draft")  # draft, completed, reviewed
    is_urgent = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    child = relationship("Child", back_populates="assessments")
    assessor = relationship("User", back_populates="assessments")
    
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
