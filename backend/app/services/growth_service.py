"""
Growth record service for business logic and CRUD operations
"""

from typing import Optional, List, Tuple, Dict
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from datetime import date, timedelta
import math

from app.models.growth_record import GrowthRecord
from app.models.child import Child
from app.models.user import User
from app.schemas.growth import GrowthRecordCreate, GrowthRecordUpdate, GrowthSearch
from fastapi import HTTPException, status

class GrowthService:
    """Service class for growth record operations"""
    
    @staticmethod
    def calculate_bmi(weight: float, height_cm: Optional[float]) -> Optional[float]:
        """Calculate BMI from weight (kg) and height (cm)"""
        if height_cm is None or height_cm <= 0:
            return None
        height_m = height_cm / 100
        return round(weight / (height_m * height_m), 2)
    
    @staticmethod
    def determine_growth_status(bmi: Optional[float], age_months: int) -> str:
        """Determine growth status based on BMI and age (simplified logic)"""
        if bmi is None:
            return "unknown"
        
        # Simplified status logic - in production, use WHO growth standards
        if age_months < 24:  # Under 2 years
            if bmi < 14:
                return "underweight"
            elif bmi > 20:
                return "overweight"
            else:
                return "normal"
        else:  # 2+ years
            if bmi < 15:
                return "underweight"
            elif bmi > 22:
                return "overweight"
            else:
                return "normal"
    
    @staticmethod
    def create_growth_record(db: Session, record_data: GrowthRecordCreate, user_id: int, user_role: str) -> GrowthRecord:
        """Create a new growth record"""
        # Verify child exists and user has access
        child = db.query(Child).filter(Child.id == record_data.child_id).first()
        if not child:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Child not found"
            )
        
        # Check access permissions
        if user_role == "vht" and child.vht_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No permission to add records for this child"
            )
        elif user_role in ["nurse", "doctor"]:
            user = db.query(User).filter(User.id == user_id).first()
            vht_user = db.query(User).filter(User.id == child.vht_user_id).first()
            if user and vht_user and user.district != vht_user.district:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No permission to add records for children outside your district"
                )
        
        # Check for duplicate measurement on the same date
        existing_record = db.query(GrowthRecord).filter(
            GrowthRecord.child_id == record_data.child_id,
            GrowthRecord.measurement_date == record_data.measurement_date
        ).first()
        
        if existing_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A growth record already exists for this child on this date"
            )
        
        # Calculate BMI and status
        bmi = GrowthService.calculate_bmi(record_data.weight, record_data.height)
        age_months = (record_data.measurement_date - child.date_of_birth).days // 30
        overall_status = GrowthService.determine_growth_status(bmi, age_months)
        
        # Create growth record
        db_record = GrowthRecord(
            child_id=record_data.child_id,
            measurement_date=record_data.measurement_date,
            weight=record_data.weight,
            height=record_data.height,
            head_circumference=record_data.head_circumference,
            mid_upper_arm_circumference=record_data.mid_upper_arm_circumference,
            notes=record_data.notes,
            measured_by=record_data.measured_by,
            bmi=bmi,
            overall_status=overall_status
        )
        
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        
        return db_record
    
    @staticmethod
    def get_growth_record(db: Session, record_id: int, user_id: int, user_role: str) -> Optional[GrowthRecord]:
        """Get a growth record by ID with access control"""
        query = db.query(GrowthRecord).filter(GrowthRecord.id == record_id)
        
        # Apply access control through child relationship
        if user_role == "vht":
            query = query.join(Child).filter(Child.vht_user_id == user_id)
        elif user_role in ["nurse", "doctor"]:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                query = query.join(Child).join(User).filter(User.district == user.district)
        
        return query.first()
    
    @staticmethod
    def update_growth_record(db: Session, record_id: int, record_update: GrowthRecordUpdate, user_id: int, user_role: str) -> Optional[GrowthRecord]:
        """Update a growth record"""
        record = GrowthService.get_growth_record(db, record_id, user_id, user_role)
        if not record:
            return None
        
        # Get child for calculations
        child = db.query(Child).filter(Child.id == record.child_id).first()
        
        # Update fields
        update_data = record_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(record, field, value)
        
        # Recalculate BMI and status if weight or height changed
        if 'weight' in update_data or 'height' in update_data:
            record.bmi = GrowthService.calculate_bmi(record.weight, record.height)
            if child:
                age_months = (record.measurement_date - child.date_of_birth).days // 30
                record.overall_status = GrowthService.determine_growth_status(record.bmi, age_months)
        
        db.commit()
        db.refresh(record)
        
        return record
    
    @staticmethod
    def delete_growth_record(db: Session, record_id: int, user_id: int, user_role: str) -> bool:
        """Delete a growth record"""
        record = GrowthService.get_growth_record(db, record_id, user_id, user_role)
        if not record:
            return False
        
        # Only allow deletion by admin or the original measurer
        if user_role != "admin" and record.measured_by != f"User {user_id}":
            return False
        
        db.delete(record)
        db.commit()
        
        return True
    
    @staticmethod
    def get_child_growth_records(db: Session, child_id: int, user_id: int, user_role: str, page: int = 1, per_page: int = 20) -> Tuple[List[GrowthRecord], int]:
        """Get all growth records for a specific child"""
        # Verify access to child
        child = db.query(Child).filter(Child.id == child_id).first()
        if not child:
            return [], 0
        
        # Check access permissions
        if user_role == "vht" and child.vht_user_id != user_id:
            return [], 0
        elif user_role in ["nurse", "doctor"]:
            user = db.query(User).filter(User.id == user_id).first()
            vht_user = db.query(User).filter(User.id == child.vht_user_id).first()
            if user and vht_user and user.district != vht_user.district:
                return [], 0
        
        query = db.query(GrowthRecord).filter(
            GrowthRecord.child_id == child_id
        ).order_by(desc(GrowthRecord.measurement_date))
        
        total = query.count()
        offset = (page - 1) * per_page
        records = query.offset(offset).limit(per_page).all()
        
        return records, total
    
    @staticmethod
    def search_growth_records(db: Session, search_params: GrowthSearch, user_id: int, user_role: str) -> Tuple[List[GrowthRecord], int]:
        """Search growth records with filters"""
        query = db.query(GrowthRecord)
        
        # Apply access control
        if user_role == "vht":
            query = query.join(Child).filter(Child.vht_user_id == user_id)
        elif user_role in ["nurse", "doctor"]:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                query = query.join(Child).join(User).filter(User.district == user.district)
        
        # Apply filters
        if search_params.child_id:
            query = query.filter(GrowthRecord.child_id == search_params.child_id)
        
        if search_params.date_from:
            query = query.filter(GrowthRecord.measurement_date >= search_params.date_from)
        
        if search_params.date_to:
            query = query.filter(GrowthRecord.measurement_date <= search_params.date_to)
        
        if search_params.weight_min:
            query = query.filter(GrowthRecord.weight >= search_params.weight_min)
        
        if search_params.weight_max:
            query = query.filter(GrowthRecord.weight <= search_params.weight_max)
        
        if search_params.height_min:
            query = query.filter(GrowthRecord.height >= search_params.height_min)
        
        if search_params.height_max:
            query = query.filter(GrowthRecord.height <= search_params.height_max)
        
        if search_params.overall_status:
            query = query.filter(GrowthRecord.overall_status == search_params.overall_status)
        
        if search_params.measured_by:
            query = query.filter(GrowthRecord.measured_by.ilike(f"%{search_params.measured_by}%"))
        
        # Order by measurement date (newest first)
        query = query.order_by(desc(GrowthRecord.measurement_date))
        
        total = query.count()
        offset = (search_params.page - 1) * search_params.per_page
        records = query.offset(offset).limit(search_params.per_page).all()
        
        return records, total
    
    @staticmethod
    def get_growth_trend(db: Session, child_id: int, user_id: int, user_role: str, months: int = 6) -> Dict:
        """Analyze growth trend for a child over specified months"""
        # Get recent records
        cutoff_date = date.today() - timedelta(days=months * 30)
        records, _ = GrowthService.get_child_growth_records(db, child_id, user_id, user_role, 1, 100)
        
        # Filter to time period
        recent_records = [r for r in records if r.measurement_date >= cutoff_date]
        
        if len(recent_records) < 2:
            return {
                "child_id": child_id,
                "measurement_period_months": months,
                "weight_trend": "insufficient_data",
                "height_trend": "insufficient_data",
                "measurements_count": len(recent_records),
                "risk_level": "unknown",
                "recommendations": ["Need more measurements for trend analysis"]
            }
        
        # Sort by date
        recent_records.sort(key=lambda x: x.measurement_date)
        
        # Calculate trends
        first_record = recent_records[0]
        latest_record = recent_records[-1]
        
        weight_change = latest_record.weight - first_record.weight
        height_change = (latest_record.height or 0) - (first_record.height or 0) if first_record.height and latest_record.height else None
        
        # Determine trends
        weight_trend = "stable"
        if weight_change > 0.5:
            weight_trend = "increasing"
        elif weight_change < -0.5:
            weight_trend = "decreasing"
        
        height_trend = None
        if height_change is not None:
            if height_change > 2:
                height_trend = "increasing"
            elif height_change < -1:
                height_trend = "decreasing"
            else:
                height_trend = "stable"
        
        # Assess risk level
        risk_level = "low"
        recommendations = []
        
        if latest_record.overall_status in ["underweight", "overweight"]:
            risk_level = "medium"
            recommendations.append(f"Child is {latest_record.overall_status} - nutritional intervention needed")
        
        if weight_trend == "decreasing":
            risk_level = "high"
            recommendations.append("Weight loss detected - immediate assessment required")
        
        if not recommendations:
            recommendations.append("Continue regular monitoring")
        
        return {
            "child_id": child_id,
            "measurement_period_months": months,
            "weight_trend": weight_trend,
            "height_trend": height_trend,
            "latest_weight": latest_record.weight,
            "latest_height": latest_record.height,
            "weight_change_kg": weight_change,
            "height_change_cm": height_change,
            "measurements_count": len(recent_records),
            "risk_level": risk_level,
            "recommendations": recommendations
        }
