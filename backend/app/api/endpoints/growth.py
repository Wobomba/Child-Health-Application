"""
Growth records API endpoints
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import math

from app.core.database import get_db
from app.core.deps import get_current_user, require_vht_or_higher
from app.models.user import User
from app.schemas.growth import (
    GrowthRecordCreate, GrowthRecordUpdate, GrowthRecordResponse, 
    GrowthRecordList, GrowthSearch, GrowthTrend, ChildGrowthStats
)
from app.services.growth_service import GrowthService

router = APIRouter()

@router.post("/growth", response_model=GrowthRecordResponse)
async def create_growth_record(
    record_data: GrowthRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vht_or_higher)
) -> Any:
    """Create a new growth record"""
    try:
        record = GrowthService.create_growth_record(
            db, record_data, current_user.id, current_user.role
        )
        return record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating growth record: {str(e)}"
        )

@router.get("/growth", response_model=GrowthRecordList)
async def search_growth_records(
    child_id: int = Query(None, description="Filter by child ID"),
    date_from: str = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: str = Query(None, description="End date (YYYY-MM-DD)"),
    weight_min: float = Query(None, ge=0, description="Minimum weight"),
    weight_max: float = Query(None, ge=0, description="Maximum weight"),
    height_min: float = Query(None, ge=0, description="Minimum height"),
    height_max: float = Query(None, ge=0, description="Maximum height"),
    overall_status: str = Query(None, description="Growth status filter"),
    measured_by: str = Query(None, description="Filter by who measured"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Search growth records with filters"""
    
    from datetime import datetime
    
    # Parse dates if provided
    date_from_obj = None
    date_to_obj = None
    
    if date_from:
        try:
            date_from_obj = datetime.strptime(date_from, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date_from format. Use YYYY-MM-DD"
            )
    
    if date_to:
        try:
            date_to_obj = datetime.strptime(date_to, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date_to format. Use YYYY-MM-DD"
            )
    
    search_params = GrowthSearch(
        child_id=child_id,
        date_from=date_from_obj,
        date_to=date_to_obj,
        weight_min=weight_min,
        weight_max=weight_max,
        height_min=height_min,
        height_max=height_max,
        overall_status=overall_status,
        measured_by=measured_by,
        page=page,
        per_page=per_page
    )
    
    records, total = GrowthService.search_growth_records(
        db, search_params, current_user.id, current_user.role
    )
    
    total_pages = math.ceil(total / per_page)
    
    return GrowthRecordList(
        records=records,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )

@router.get("/growth/{record_id}", response_model=GrowthRecordResponse)
async def get_growth_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get a specific growth record"""
    record = GrowthService.get_growth_record(
        db, record_id, current_user.id, current_user.role
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Growth record not found"
        )
    return record

@router.put("/growth/{record_id}", response_model=GrowthRecordResponse)
async def update_growth_record(
    record_id: int,
    record_update: GrowthRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update a growth record"""
    record = GrowthService.update_growth_record(
        db, record_id, record_update, current_user.id, current_user.role
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Growth record not found or no permission to update"
        )
    return record

@router.delete("/growth/{record_id}")
async def delete_growth_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delete a growth record"""
    success = GrowthService.delete_growth_record(
        db, record_id, current_user.id, current_user.role
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Growth record not found or no permission to delete"
        )
    return {"message": "Growth record deleted successfully"}

@router.get("/children/{child_id}/growth", response_model=GrowthRecordList)
async def get_child_growth_records(
    child_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get all growth records for a specific child"""
    records, total = GrowthService.get_child_growth_records(
        db, child_id, current_user.id, current_user.role, page, per_page
    )
    
    total_pages = math.ceil(total / per_page)
    
    return GrowthRecordList(
        records=records,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )

@router.get("/children/{child_id}/growth/trend", response_model=GrowthTrend)
async def get_child_growth_trend(
    child_id: int,
    months: int = Query(6, ge=1, le=36, description="Number of months to analyze"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get growth trend analysis for a child"""
    trend_data = GrowthService.get_growth_trend(
        db, child_id, current_user.id, current_user.role, months
    )
    return trend_data

@router.get("/children/{child_id}/growth/stats", response_model=ChildGrowthStats)
async def get_child_growth_stats(
    child_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get growth statistics for a child"""
    records, _ = GrowthService.get_child_growth_records(
        db, child_id, current_user.id, current_user.role, 1, 1000
    )
    
    if not records:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No growth records found for this child"
        )
    
    # Sort by date
    records.sort(key=lambda x: x.measurement_date)
    
    first_record = records[0]
    latest_record = records[-1]
    
    # Calculate statistics
    weight_gain = latest_record.weight - first_record.weight if len(records) > 1 else 0
    height_gain = None
    if first_record.height and latest_record.height and len(records) > 1:
        height_gain = latest_record.height - first_record.height
    
    # Calculate measurement frequency
    if len(records) > 1:
        days_span = (latest_record.measurement_date - first_record.measurement_date).days
        frequency = days_span / len(records) if days_span > 0 else None
    else:
        frequency = None
    
    return ChildGrowthStats(
        child_id=child_id,
        total_measurements=len(records),
        first_measurement_date=first_record.measurement_date,
        latest_measurement_date=latest_record.measurement_date,
        current_weight=latest_record.weight,
        current_height=latest_record.height,
        current_bmi=latest_record.bmi,
        current_status=latest_record.overall_status,
        weight_gain_kg=weight_gain,
        height_gain_cm=height_gain,
        measurement_frequency_days=frequency
    )

@router.get("/growth/summary/stats")
async def get_growth_summary_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get summary statistics for growth monitoring"""
    
    from sqlalchemy import func
    from app.models.growth_record import GrowthRecord
    from app.models.child import Child
    
    # Base query with access control
    query = db.query(GrowthRecord)
    
    if current_user.role == "vht":
        query = query.join(Child).filter(Child.vht_user_id == current_user.id)
    elif current_user.role in ["nurse", "doctor"]:
        from app.models.user import User as UserModel
        query = query.join(Child).join(UserModel).filter(UserModel.district == current_user.district)
    
    # Calculate statistics
    total_records = query.count()
    
    # Status distribution
    status_stats = db.query(
        GrowthRecord.overall_status,
        func.count(GrowthRecord.id)
    ).group_by(GrowthRecord.overall_status)
    
    if current_user.role == "vht":
        status_stats = status_stats.join(Child).filter(Child.vht_user_id == current_user.id)
    elif current_user.role in ["nurse", "doctor"]:
        from app.models.user import User as UserModel
        status_stats = status_stats.join(Child).join(UserModel).filter(UserModel.district == current_user.district)
    
    status_distribution = {status: count for status, count in status_stats.all()}
    
    # Recent measurements (last 30 days)
    from datetime import date, timedelta
    recent_cutoff = date.today() - timedelta(days=30)
    recent_count = query.filter(GrowthRecord.measurement_date >= recent_cutoff).count()
    
    return {
        "total_records": total_records,
        "recent_measurements_30d": recent_count,
        "status_distribution": status_distribution,
        "average_measurements_per_day": round(recent_count / 30, 2),
        "children_with_records": query.with_entities(GrowthRecord.child_id).distinct().count()
    }
