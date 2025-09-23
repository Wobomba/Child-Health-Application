"""
Children API endpoints
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import math

from app.core.database import get_db
from app.core.deps import get_current_user, require_vht_or_higher
from app.models.user import User
from app.models.child import Child
from app.schemas.child import (
    ChildCreate, ChildUpdate, ChildResponse, ChildList, 
    ChildSummary, ChildSearch
)
from app.services.child_service import ChildService

router = APIRouter()

@router.post("/children", response_model=ChildResponse)
async def create_child(
    child_data: ChildCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vht_or_higher)
) -> Any:
    """Create a new child record"""
    try:
        child = ChildService.create_child(db, child_data, current_user.id)
        return child
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating child: {str(e)}"
        )

@router.get("/children", response_model=ChildList)
async def list_children(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    query: str = Query(None, description="Search query"),
    village: str = Query(None, description="Filter by village"),
    district: str = Query(None, description="Filter by district"),
    gender: str = Query(None, description="Filter by gender"),
    age_min_months: int = Query(None, ge=0, description="Minimum age in months"),
    age_max_months: int = Query(None, ge=0, description="Maximum age in months"),
    has_disabilities: bool = Query(None, description="Filter by disability status"),
    is_active: bool = Query(True, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """List children with filtering and pagination"""
    
    search_params = ChildSearch(
        query=query,
        village=village,
        district=district,
        gender=gender,
        age_min_months=age_min_months,
        age_max_months=age_max_months,
        has_disabilities=has_disabilities,
        is_active=is_active,
        page=page,
        per_page=per_page
    )
    
    children, total = ChildService.search_children(
        db, search_params, current_user.id, current_user.role
    )
    
    total_pages = math.ceil(total / per_page)
    
    return ChildList(
        children=children,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )

@router.get("/children/{child_id}", response_model=ChildResponse)
async def get_child(
    child_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get a specific child by ID"""
    child = ChildService.get_child(db, child_id, current_user.id, current_user.role)
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    return child

@router.get("/children/unique/{unique_id}", response_model=ChildResponse)
async def get_child_by_unique_id(
    unique_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get a specific child by unique ID"""
    child = ChildService.get_child_by_unique_id(
        db, unique_id, current_user.id, current_user.role
    )
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    return child

@router.put("/children/{child_id}", response_model=ChildResponse)
async def update_child(
    child_id: int,
    child_update: ChildUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update a child's information"""
    child = ChildService.update_child(
        db, child_id, child_update, current_user.id, current_user.role
    )
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found or no permission to update"
        )
    return child

@router.delete("/children/{child_id}")
async def delete_child(
    child_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delete (deactivate) a child record"""
    success = ChildService.delete_child(
        db, child_id, current_user.id, current_user.role
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found or no permission to delete"
        )
    return {"message": "Child deleted successfully"}

@router.get("/children/vht/{vht_user_id}", response_model=ChildList)
async def get_children_by_vht(
    vht_user_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get all children assigned to a specific VHT"""
    
    # Check permissions
    if current_user.role == "vht" and current_user.id != vht_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="VHTs can only view their own children"
        )
    
    children, total = ChildService.get_children_by_vht(
        db, vht_user_id, page, per_page
    )
    
    total_pages = math.ceil(total / per_page)
    
    return ChildList(
        children=children,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )

@router.get("/children/summary/stats")
async def get_children_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get summary statistics about children"""
    
    # Build base query with access control
    query = db.query(Child)
    
    if current_user.role == "vht":
        query = query.filter(Child.vht_user_id == current_user.id)
    elif current_user.role in ["nurse", "doctor"]:
        from app.models.user import User as UserModel
        query = query.join(UserModel).filter(UserModel.district == current_user.district)
    
    # Calculate statistics
    total_children = query.filter(Child.is_active == True).count()
    male_count = query.filter(Child.gender == "male", Child.is_active == True).count()
    female_count = query.filter(Child.gender == "female", Child.is_active == True).count()
    with_disabilities = query.filter(Child.has_disabilities == True, Child.is_active == True).count()
    
    return {
        "total_children": total_children,
        "male_count": male_count,
        "female_count": female_count,
        "with_disabilities": with_disabilities,
        "by_gender": {
            "male": male_count,
            "female": female_count
        }
    }
