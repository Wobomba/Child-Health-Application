"""
Growth record model for tracking child growth measurements
"""

from sqlalchemy import Column, Integer, Float, Date, DateTime, Text, ForeignKey, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class GrowthRecord(Base):
    __tablename__ = "growth_records"
    
    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    measurement_date = Column(Date, nullable=False)
    
    # Measurements
    weight = Column(Float, nullable=False)  # in kg
    height = Column(Float, nullable=True)   # in cm
    head_circumference = Column(Float, nullable=True)  # in cm
    mid_upper_arm_circumference = Column(Float, nullable=True)  # in cm
    
    # Calculated values
    weight_for_age_zscore = Column(Float, nullable=True)
    height_for_age_zscore = Column(Float, nullable=True)
    weight_for_height_zscore = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)
    
    # Growth status
    weight_status = Column(String(20), nullable=True)  # normal, underweight, overweight
    height_status = Column(String(20), nullable=True)  # normal, stunted, tall
    overall_status = Column(String(20), nullable=True)  # normal, malnourished, obese
    
    # Notes
    notes = Column(Text, nullable=True)
    measured_by = Column(String(100), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    child = relationship("Child", back_populates="growth_records")
    
    def __repr__(self):
        return f"<GrowthRecord(id={self.id}, child_id={self.child_id}, date='{self.measurement_date}')>"
    
    @property
    def age_months_at_measurement(self):
        """Calculate child's age in months at the time of measurement"""
        from datetime import date
        age_delta = self.measurement_date - self.child.date_of_birth
        return age_delta.days // 30
