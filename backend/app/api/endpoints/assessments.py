from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.assessment import Assessment
from app.schemas.assessment import (
    HealthAssessmentCreate,
    HealthAssessmentUpdate,
    HealthAssessmentResponse,
    AssessmentStatus,
    RiskLevel
)
from app.services.assessment_service import AssessmentService

router = APIRouter()

@router.post("/", response_model=HealthAssessmentResponse, status_code=201)
def create_assessment(
    assessment: HealthAssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new health assessment for a child."""
    if current_user.role not in ["vht", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only VHTs and admins can create health assessments"
        )
    
    assessment_service = AssessmentService(db)
    return assessment_service.create_assessment(assessment, current_user.id)

@router.get("/", response_model=List[HealthAssessmentResponse])
def get_assessments(
    child_id: Optional[int] = None,
    status: Optional[AssessmentStatus] = None,
    risk_level: Optional[RiskLevel] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get health assessments with optional filtering."""
    assessment_service = AssessmentService(db)
    return assessment_service.get_assessments(
        child_id=child_id,
        status=status,
        risk_level=risk_level,
        skip=skip,
        limit=limit,
        user_id=current_user.id,
        user_role=current_user.role
    )

@router.get("/{assessment_id}", response_model=HealthAssessmentResponse)
def get_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific health assessment by ID."""
    assessment_service = AssessmentService(db)
    assessment = assessment_service.get_assessment(assessment_id, current_user.id, current_user.role)
    
    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Health assessment not found"
        )
    
    return assessment

@router.put("/{assessment_id}", response_model=HealthAssessmentResponse)
def update_assessment(
    assessment_id: int,
    assessment_update: HealthAssessmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a health assessment."""
    if current_user.role not in ["vht", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only VHTs and admins can update health assessments"
        )
    
    assessment_service = AssessmentService(db)
    assessment = assessment_service.update_assessment(
        assessment_id, 
        assessment_update, 
        current_user.id, 
        current_user.role
    )
    
    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Health assessment not found"
        )
    
    return assessment

@router.delete("/{assessment_id}")
def delete_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Soft delete a health assessment."""
    if current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only admins can delete health assessments"
        )
    
    assessment_service = AssessmentService(db)
    success = assessment_service.delete_assessment(assessment_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Health assessment not found"
        )
    
    return {"message": "Health assessment deleted successfully"}

@router.get("/child/{child_id}", response_model=List[HealthAssessmentResponse])
def get_child_assessments(
    child_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all health assessments for a specific child."""
    assessment_service = AssessmentService(db)
    return assessment_service.get_child_assessments(
        child_id, 
        current_user.id, 
        current_user.role, 
        skip, 
        limit
    )

@router.post("/{assessment_id}/complete")
def complete_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark an assessment as completed."""
    if current_user.role not in ["vht", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only VHTs and admins can complete assessments"
        )
    
    assessment_service = AssessmentService(db)
    success = assessment_service.complete_assessment(assessment_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Health assessment not found"
        )
    
    return {"message": "Assessment completed successfully"}

@router.get("/stats/summary")
def get_assessment_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get assessment statistics summary."""
    assessment_service = AssessmentService(db)
    return assessment_service.get_assessment_stats(current_user.id, current_user.role)
