from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.models.assessment import Assessment
from app.models.child import Child
from app.schemas.assessment import (
    HealthAssessmentCreate,
    HealthAssessmentUpdate,
    AssessmentStatus,
    RiskLevel
)

class AssessmentService:
    def __init__(self, db: Session):
        self.db = db

    def create_assessment(self, assessment_data: HealthAssessmentCreate, vht_user_id: int) -> Assessment:
        """Create a new health assessment."""
        # Verify the child exists and belongs to the VHT
        child = self.db.query(Child).filter(
            and_(
                Child.id == assessment_data.child_id,
                Child.vht_user_id == vht_user_id,
                Child.is_deleted == False
            )
        ).first()
        
        if not child:
            raise ValueError("Child not found or access denied")
        
        # Create the assessment
        assessment = Assessment(
            child_id=assessment_data.child_id,
            vht_user_id=vht_user_id,
            assessment_type=assessment_data.assessment_type,
            assessment_date=assessment_data.assessment_date,
            weight_kg=assessment_data.weight_kg,
            height_cm=assessment_data.height_cm,
            head_circumference_cm=assessment_data.head_circumference_cm,
            muac_cm=assessment_data.muac_cm,
            temperature_celsius=assessment_data.temperature_celsius,
            blood_pressure_systolic=assessment_data.blood_pressure_systolic,
            blood_pressure_diastolic=assessment_data.blood_pressure_diastolic,
            heart_rate_bpm=assessment_data.heart_rate_bpm,
            respiratory_rate=assessment_data.respiratory_rate,
            oxygen_saturation=assessment_data.oxygen_saturation,
            general_appearance=assessment_data.general_appearance,
            skin_condition=assessment_data.skin_condition,
            eye_condition=assessment_data.eye_condition,
            ear_condition=assessment_data.ear_condition,
            nose_condition=assessment_data.nose_condition,
            throat_condition=assessment_data.throat_condition,
            chest_condition=assessment_data.chest_condition,
            abdomen_condition=assessment_data.abdomen_condition,
            neurological_condition=assessment_data.neurological_condition,
            musculoskeletal_condition=assessment_data.musculoskeletal_condition,
            developmental_milestones=assessment_data.developmental_milestones,
            immunization_status=assessment_data.immunization_status,
            feeding_history=assessment_data.feeding_history,
            sleep_patterns=assessment_data.sleep_patterns,
            behavioral_notes=assessment_data.behavioral_notes,
            family_history=assessment_data.family_history,
            social_history=assessment_data.social_history,
            environmental_factors=assessment_data.environmental_factors,
            chief_complaint=assessment_data.chief_complaint,
            history_present_illness=assessment_data.history_present_illness,
            review_of_systems=assessment_data.review_of_systems,
            physical_examination=assessment_data.physical_examination,
            assessment_notes=assessment_data.assessment_notes,
            diagnosis=assessment_data.diagnosis,
            treatment_plan=assessment_data.treatment_plan,
            follow_up_instructions=assessment_data.follow_up_instructions,
            referral_required=assessment_data.referral_required,
            referral_details=assessment_data.referral_details,
            risk_level=assessment_data.risk_level,
            priority_score=assessment_data.priority_score,
            ai_analysis_id=assessment_data.ai_analysis_id,
            ai_confidence_score=assessment_data.ai_confidence_score,
            ai_risk_indicators=assessment_data.ai_risk_indicators,
            ai_recommendations=assessment_data.ai_recommendations,
            status=assessment_data.status,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        self.db.add(assessment)
        self.db.commit()
        self.db.refresh(assessment)
        return assessment

    def get_assessment(self, assessment_id: int, user_id: int, user_role: str) -> Optional[Assessment]:
        """Get a specific health assessment by ID."""
        query = self.db.query(Assessment).filter(Assessment.id == assessment_id)
        
        # VHTs can only see their own assessments
        if user_role == "vht":
            query = query.filter(Assessment.vht_user_id == user_id)
        
        return query.first()

    def get_assessments(
        self, 
        child_id: Optional[int] = None,
        status: Optional[AssessmentStatus] = None,
        risk_level: Optional[RiskLevel] = None,
        skip: int = 0,
        limit: int = 100,
        user_id: int = None,
        user_role: str = None
    ) -> List[Assessment]:
        """Get health assessments with optional filtering."""
        query = self.db.query(Assessment)
        
        # VHTs can only see their own assessments
        if user_role == "vht":
            query = query.filter(Assessment.vht_user_id == user_id)
        
        if child_id:
            query = query.filter(Assessment.child_id == child_id)
        
        if status:
            query = query.filter(Assessment.status == status)
        
        if risk_level:
            query = query.filter(Assessment.risk_level == risk_level)
        
        return query.offset(skip).limit(limit).all()

    def get_child_assessments(
        self, 
        child_id: int, 
        user_id: int, 
        user_role: str, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Assessment]:
        """Get all health assessments for a specific child."""
        query = self.db.query(Assessment).filter(Assessment.child_id == child_id)
        
        # VHTs can only see their own assessments
        if user_role == "vht":
            query = query.filter(Assessment.vht_user_id == user_id)
        
        return query.order_by(desc(Assessment.assessment_date)).offset(skip).limit(limit).all()

    def update_assessment(
        self, 
        assessment_id: int, 
        assessment_update: HealthAssessmentUpdate, 
        user_id: int, 
        user_role: str
    ) -> Optional[Assessment]:
        """Update a health assessment."""
        assessment = self.get_assessment(assessment_id, user_id, user_role)
        
        if not assessment:
            return None
        
        # Update only provided fields
        update_data = assessment_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(assessment, field, value)
        
        assessment.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(assessment)
        return assessment

    def delete_assessment(self, assessment_id: int, user_id: int) -> bool:
        """Soft delete a health assessment (admin only)."""
        assessment = self.db.query(Assessment).filter(Assessment.id == assessment_id).first()
        
        if not assessment:
            return False
        
        # Soft delete by setting status to cancelled
        assessment.status = AssessmentStatus.CANCELLED
        assessment.updated_at = datetime.utcnow()
        
        self.db.commit()
        return True

    def complete_assessment(self, assessment_id: int, user_id: int) -> bool:
        """Mark an assessment as completed."""
        assessment = self.get_assessment(assessment_id, user_id, "vht")
        
        if not assessment:
            return False
        
        assessment.status = AssessmentStatus.COMPLETED
        assessment.updated_at = datetime.utcnow()
        
        self.db.commit()
        return True

    def get_assessment_stats(self, user_id: int, user_role: str) -> Dict[str, Any]:
        """Get assessment statistics summary."""
        query = self.db.query(Assessment)
        
        # VHTs can only see their own assessments
        if user_role == "vht":
            query = query.filter(Assessment.vht_user_id == user_id)
        
        total_assessments = query.count()
        
        # Status breakdown
        status_breakdown = {}
        for status in AssessmentStatus:
            count = query.filter(Assessment.status == status).count()
            status_breakdown[status.value] = count
        
        # Risk level breakdown
        risk_breakdown = {}
        for risk_level in RiskLevel:
            count = query.filter(Assessment.risk_level == risk_level).count()
            risk_breakdown[risk_level.value] = count
        
        # Recent assessments (last 30 days)
        thirty_days_ago = datetime.utcnow().replace(day=datetime.utcnow().day - 30)
        recent_assessments = query.filter(
            Assessment.assessment_date >= thirty_days_ago
        ).count()
        
        # High priority assessments
        high_priority = query.filter(
            or_(
                Assessment.risk_level == RiskLevel.HIGH,
                Assessment.risk_level == RiskLevel.CRITICAL
            )
        ).count()
        
        return {
            "total_assessments": total_assessments,
            "status_breakdown": status_breakdown,
            "risk_breakdown": risk_breakdown,
            "recent_assessments": recent_assessments,
            "high_priority_assessments": high_priority
        }
