"""
Child model for storing child information and demographics
"""

from sqlalchemy import Column, Integer, String, Date, Boolean, DateTime, Text, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Child(Base):
    __tablename__ = "children"
    
    id = Column(Integer, primary_key=True, index=True)
    unique_id = Column(String(50), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(10), nullable=False)  # male, female
    village = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    
    # Parent/Guardian information
    parent_name = Column(String(100), nullable=False)
    parent_phone = Column(String(20), nullable=True)
    parent_address = Column(Text, nullable=True)
    
    # VHT assignment
    vht_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Health information
    birth_weight = Column(Float, nullable=True)  # in kg
    has_disabilities = Column(Boolean, default=False)
    disability_details = Column(Text, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    vht_user = relationship("User", back_populates="children")
    growth_records = relationship("GrowthRecord", back_populates="child")
    photos = relationship("Photo", back_populates="child")
    assessments = relationship("Assessment", back_populates="child")
    
    def __repr__(self):
        return f"<Child(id={self.id}, name='{self.first_name} {self.last_name}', village='{self.village}')>"
    
    @property
    def age_months(self):
        """Calculate age in months"""
        from datetime import date
        today = date.today()
        age_delta = today - self.date_of_birth
        return age_delta.days // 30
