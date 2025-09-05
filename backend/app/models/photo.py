"""
Photo model for storing child photos and AI analysis results
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Photo(Base):
    __tablename__ = "photos"
    
    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    
    # File information
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    mime_type = Column(String(100), nullable=False)
    
    # Photo metadata
    photo_type = Column(String(50), nullable=False)  # face, body, arm, etc.
    taken_date = Column(DateTime, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    location = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)  # User notes about the photo
    
    # AI Analysis results
    malnutrition_score = Column(Float, nullable=True)  # 0.0 to 1.0
    confidence_level = Column(Float, nullable=True)   # 0.0 to 1.0
    analysis_status = Column(String(20), default="pending")  # pending, processing, completed, failed
    
    # Analysis details
    detected_features = Column(Text, nullable=True)  # JSON string of detected features
    recommendations = Column(Text, nullable=True)    # AI-generated recommendations
    analysis_notes = Column(Text, nullable=True)     # Manual notes from healthcare workers
    
    # Processing flags
    is_analyzed = Column(Boolean, default=False)
    is_flagged = Column(Boolean, default=False)      # Flagged for review
    flag_reason = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    child = relationship("Child", back_populates="photos")
    uploader = relationship("User", foreign_keys=[uploaded_by])
    
    def __repr__(self):
        return f"<Photo(id={self.id}, child_id={self.child_id}, type='{self.photo_type}')>"
    
    @property
    def is_malnourished(self):
        """Determine if child is malnourished based on AI score"""
        if self.malnutrition_score is None:
            return None
        return self.malnutrition_score > 0.7  # Threshold for malnutrition
    
    @property
    def file_size_mb(self):
        """Get file size in MB"""
        return round(self.file_size / (1024 * 1024), 2)
