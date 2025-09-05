"""
Child service for business logic and CRUD operations
"""

from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import date, timedelta
import uuid

from app.models.child import Child
from app.models.user import User
from app.schemas.child import ChildCreate, ChildUpdate, ChildSearch
from fastapi import HTTPException, status

class ChildService:
    """Service class for child-related operations"""
    
    @staticmethod
    def generate_unique_id(db: Session) -> str:
        """Generate a unique child ID"""
        while True:
            # Format: CH + 6 digit number
            unique_id = f"CH{str(uuid.uuid4().int)[:6]}"
            
            # Check if it already exists
            existing = db.query(Child).filter(Child.unique_id == unique_id).first()
            if not existing:
                return unique_id
    
    @staticmethod
    def create_child(db: Session, child_data: ChildCreate, vht_user_id: int) -> Child:
        """Create a new child"""
        # Generate unique ID if not provided
        unique_id = child_data.unique_id or ChildService.generate_unique_id(db)
        
        # Check if unique_id already exists
        existing_child = db.query(Child).filter(Child.unique_id == unique_id).first()
        if existing_child:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Child with unique_id '{unique_id}' already exists"
            )
        
        # Verify VHT user exists and is active
        vht_user = db.query(User).filter(
            User.id == vht_user_id,
            User.is_active == True
        ).first()
        if not vht_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid VHT user"
            )
        
        # Create child
        db_child = Child(
            unique_id=unique_id,
            first_name=child_data.first_name,
            last_name=child_data.last_name,
            date_of_birth=child_data.date_of_birth,
            gender=child_data.gender,
            village=child_data.village,
            district=child_data.district,
            parent_name=child_data.parent_name,
            parent_phone=child_data.parent_phone,
            parent_address=child_data.parent_address,
            vht_user_id=vht_user_id,
            birth_weight=child_data.birth_weight,
            has_disabilities=child_data.has_disabilities,
            disability_details=child_data.disability_details,
            is_active=True
        )
        
        db.add(db_child)
        db.commit()
        db.refresh(db_child)
        
        return db_child
    
    @staticmethod
    def get_child(db: Session, child_id: int, user_id: int, user_role: str) -> Optional[Child]:
        """Get a child by ID with access control"""
        query = db.query(Child).filter(Child.id == child_id)
        
        # Apply access control
        if user_role == "vht":
            # VHTs can only see their own children
            query = query.filter(Child.vht_user_id == user_id)
        elif user_role in ["nurse", "doctor"]:
            # Nurses and doctors can see all children in their district
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                query = query.join(User).filter(User.district == user.district)
        # Admins can see all children (no additional filter)
        
        return query.first()
    
    @staticmethod
    def get_child_by_unique_id(db: Session, unique_id: str, user_id: int, user_role: str) -> Optional[Child]:
        """Get a child by unique ID with access control"""
        query = db.query(Child).filter(Child.unique_id == unique_id)
        
        # Apply same access control as get_child
        if user_role == "vht":
            query = query.filter(Child.vht_user_id == user_id)
        elif user_role in ["nurse", "doctor"]:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                query = query.join(User).filter(User.district == user.district)
        
        return query.first()
    
    @staticmethod
    def update_child(db: Session, child_id: int, child_update: ChildUpdate, user_id: int, user_role: str) -> Optional[Child]:
        """Update a child's information"""
        # Get child with access control
        child = ChildService.get_child(db, child_id, user_id, user_role)
        if not child:
            return None
        
        # Update fields
        update_data = child_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(child, field, value)
        
        db.commit()
        db.refresh(child)
        
        return child
    
    @staticmethod
    def delete_child(db: Session, child_id: int, user_id: int, user_role: str) -> bool:
        """Soft delete a child (set is_active to False)"""
        child = ChildService.get_child(db, child_id, user_id, user_role)
        if not child:
            return False
        
        # Only admins and the assigned VHT can delete
        if user_role not in ["admin"] and child.vht_user_id != user_id:
            return False
        
        child.is_active = False
        db.commit()
        
        return True
    
    @staticmethod
    def search_children(db: Session, search_params: ChildSearch, user_id: int, user_role: str) -> Tuple[List[Child], int]:
        """Search children with filters and pagination"""
        query = db.query(Child)
        
        # Apply access control
        if user_role == "vht":
            query = query.filter(Child.vht_user_id == user_id)
        elif user_role in ["nurse", "doctor"]:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                query = query.join(User).filter(User.district == user.district)
        
        # Apply filters
        if search_params.query:
            search_term = f"%{search_params.query}%"
            query = query.filter(
                or_(
                    Child.first_name.ilike(search_term),
                    Child.last_name.ilike(search_term),
                    Child.unique_id.ilike(search_term),
                    Child.parent_name.ilike(search_term)
                )
            )
        
        if search_params.village:
            query = query.filter(Child.village.ilike(f"%{search_params.village}%"))
        
        if search_params.district:
            query = query.filter(Child.district.ilike(f"%{search_params.district}%"))
        
        if search_params.gender:
            query = query.filter(Child.gender == search_params.gender)
        
        if search_params.has_disabilities is not None:
            query = query.filter(Child.has_disabilities == search_params.has_disabilities)
        
        if search_params.is_active is not None:
            query = query.filter(Child.is_active == search_params.is_active)
        
        # Age filters (approximate)
        if search_params.age_min_months is not None:
            # Calculate date for minimum age
            days_for_min_age = search_params.age_min_months * 30
            min_birth_date = date.today() - timedelta(days=days_for_min_age)
            query = query.filter(Child.date_of_birth <= min_birth_date)
        
        if search_params.age_max_months is not None:
            # Calculate date for maximum age
            days_for_max_age = search_params.age_max_months * 30
            max_birth_date = date.today() - timedelta(days=days_for_max_age)
            query = query.filter(Child.date_of_birth >= max_birth_date)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (search_params.page - 1) * search_params.per_page
        children = query.offset(offset).limit(search_params.per_page).all()
        
        return children, total
    
    @staticmethod
    def get_children_by_vht(db: Session, vht_user_id: int, page: int = 1, per_page: int = 20) -> Tuple[List[Child], int]:
        """Get all children assigned to a specific VHT"""
        query = db.query(Child).filter(
            Child.vht_user_id == vht_user_id,
            Child.is_active == True
        )
        
        total = query.count()
        offset = (page - 1) * per_page
        children = query.offset(offset).limit(per_page).all()
        
        return children, total
