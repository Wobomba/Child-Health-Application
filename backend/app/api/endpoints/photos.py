
"""
Photo management API endpoints
"""

from typing import List, Optional
from datetime import datetime
import asyncio
import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, BackgroundTasks, Query
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_vht_or_higher
from app.core.security import verify_token
from app.models.user import User
from app.models.photo import Photo
from app.schemas.photo import (
    PhotoUpload, PhotoResponse, PhotoList, PhotoUpdate, PhotoSearch,
    AIAnalysisRequest, AIAnalysisResponse, PhotoSummary, PhotoType, AnalysisStatus
)
from app.services.photo_service import photo_service
from app.services.ai_service import ai_analysis_service

router = APIRouter()


@router.post("/", response_model=PhotoResponse, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Image file to upload"),
    child_id: int = Form(..., description="ID of the child"),
    photo_type: PhotoType = Form(default=PhotoType.FACE, description="Type of photo"),
    notes: Optional[str] = Form(None, description="Optional notes about the photo"),
    auto_analyze: bool = Form(default=True, description="Automatically analyze photo with AI"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vht_or_higher)
):
    """
    Upload a new photo for a child
    
    - **file**: Image file (JPEG, PNG, WEBP, etc.)
    - **child_id**: ID of the child this photo belongs to
    - **photo_type**: Type of photo (face, full_body, clinical, etc.)
    - **notes**: Optional notes about the photo
    - **auto_analyze**: Whether to automatically run AI analysis
    """
    
    # Create photo upload data
    upload_data = PhotoUpload(
        child_id=child_id,
        photo_type=photo_type,
        notes=notes
    )
    
    # Save photo
    photo = photo_service.create_photo(db, upload_data, file, current_user.id)
    
    # Trigger AI analysis in background if requested
    if auto_analyze:
        background_tasks.add_task(analyze_photo_background, photo.id)
    
    return photo


async def analyze_photo_background(photo_id: int):
    """Background task to analyze photo with AI"""
    from app.core.database import SessionLocal
    
    # Create a new database session for the background task
    db = SessionLocal()
    photo = None
    try:
        photo = db.query(Photo).filter(Photo.id == photo_id).first()
        if not photo:
            print(f"Photo {photo_id} not found for background analysis")
            return
        
        if photo.analysis_status == AnalysisStatus.PENDING.value or photo.analysis_status == "pending":
            # Update status to processing
            photo.analysis_status = AnalysisStatus.PROCESSING.value
            db.commit()
            
            # Run AI analysis
            analysis_result = await ai_analysis_service.analyze_photo(photo, photo.file_path)
            
            # Update photo with results
            ai_analysis_service.update_photo_with_analysis(db, photo, analysis_result)
            print(f"Successfully analyzed photo {photo_id}")
    except Exception as e:
        # Log error and mark as failed
        db.rollback()
        try:
            if photo:
                photo.analysis_status = AnalysisStatus.FAILED.value
                photo.analysis_notes = f"Analysis failed: {str(e)}"
                db.commit()
        except Exception as commit_error:
            print(f"Failed to update photo status after error: {commit_error}")
        # Log the error (in production, use proper logging)
        print(f"Background analysis error for photo {photo_id}: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


@router.get("/", response_model=PhotoList)
def get_photos(
    search_params: PhotoSearch = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get photos with search and pagination
    
    Supports filtering by:
    - child_id: Filter by specific child
    - photo_type: Filter by photo type
    - analysis_status: Filter by analysis status
    - is_flagged: Filter flagged photos
    - date_from/date_to: Date range filter
    - has_analysis: Filter analyzed photos
    - uploaded_by: Filter by uploader
    """
    
    return photo_service.get_photos(db, search_params, current_user.id, current_user.role)


@router.get("/{photo_id}", response_model=PhotoResponse)
def get_photo(
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific photo by ID"""
    
    photo = photo_service.get_photo(db, photo_id, current_user.id, current_user.role)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )
    
    return photo


@router.put("/{photo_id}", response_model=PhotoResponse)
def update_photo(
    photo_id: int,
    update_data: PhotoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vht_or_higher)
):
    """Update photo metadata"""
    
    photo = photo_service.update_photo(db, photo_id, update_data, current_user.id, current_user.role)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )
    
    return photo


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_photo(
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vht_or_higher)
):
    """Delete a photo"""
    
    success = photo_service.delete_photo(db, photo_id, current_user.id, current_user.role)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )


@router.get("/{photo_id}/download")
def download_photo(
    photo_id: int,
    thumbnail: bool = Query(default=False, description="Download thumbnail instead of full image"),
    token: Optional[str] = Query(None, description="Auth token for image loading"),
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
):
    """Download photo file
    
    Supports token in query params for image loading via <img> tags
    """
    current_user = None
    
    # Try to get user from token in query params first (for image loading)
    if token:
        try:
            payload = verify_token(token)
            user_id = payload.get("sub")
            if user_id:
                current_user = db.query(User).filter(User.id == int(user_id)).first()
        except Exception:
            pass
    
    # Fallback to standard auth header
    if not current_user and credentials:
        try:
            payload = verify_token(credentials.credentials)
            user_id = payload.get("sub")
            if user_id:
                current_user = db.query(User).filter(User.id == int(user_id)).first()
        except Exception:
            pass
    
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    photo = photo_service.get_photo(db, photo_id, current_user.id, current_user.role)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )
    
    file_path = Path(photo.file_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo file not found on disk"
        )
    
    # For thumbnails, we would generate them on-the-fly or serve cached versions
    # For now, serve the original file
    
    return FileResponse(
        path=str(file_path),
        filename=photo.filename,
        media_type=photo.mime_type
    )


@router.post("/{photo_id}/analyze", response_model=AIAnalysisResponse)
async def analyze_photo(
    photo_id: int,
    force_reanalysis: bool = Query(default=False, description="Force re-analysis"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vht_or_higher)
):
    """
    Analyze photo with AI for malnutrition detection
    
    - **photo_id**: ID of the photo to analyze
    - **force_reanalysis**: Force re-analysis even if already analyzed
    """
    
    photo = photo_service.get_photo(db, photo_id, current_user.id, current_user.role)
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )
    
    # Check if already analyzed and not forcing re-analysis
    if photo.is_analyzed and not force_reanalysis:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Photo already analyzed. Use force_reanalysis=true to re-analyze."
        )
    
    # Check if file exists
    if not Path(photo.file_path).exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo file not found on disk"
        )
    
    try:
        # Update status to processing
        photo.analysis_status = AnalysisStatus.PROCESSING
        db.commit()
        
        # Run AI analysis
        analysis_result = await ai_analysis_service.analyze_photo(photo, photo.file_path)
        
        # Update photo with results
        updated_photo = ai_analysis_service.update_photo_with_analysis(db, photo, analysis_result)
        
        return analysis_result
        
    except Exception as e:
        # Mark as failed
        photo.analysis_status = AnalysisStatus.FAILED
        photo.analysis_notes = f"Analysis failed: {str(e)}"
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.get("/children/{child_id}/photos", response_model=List[PhotoResponse])
def get_child_photos(
    child_id: int,
    photo_type: Optional[PhotoType] = Query(None, description="Filter by photo type"),
    limit: int = Query(default=50, le=100, description="Maximum number of photos to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all photos for a specific child"""
    
    photos = photo_service.get_child_photos(db, child_id, current_user.id, current_user.role)
    
    # Filter by type if specified
    if photo_type:
        photos = [p for p in photos if p.photo_type == photo_type]
    
    # Apply limit
    photos = photos[:limit]
    
    return photos


@router.get("/summary/stats", response_model=PhotoSummary)
def get_photo_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get photo summary statistics"""
    
    return photo_service.get_photo_summary(db, current_user.id, current_user.role)


@router.post("/batch/analyze")
async def batch_analyze_photos(
    background_tasks: BackgroundTasks,
    child_id: Optional[int] = Query(None, description="Analyze photos for specific child"),
    photo_type: Optional[PhotoType] = Query(None, description="Analyze specific photo type"),
    limit: int = Query(default=10, le=50, description="Maximum photos to analyze"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vht_or_higher)
):
    """
    Analyze multiple photos in batch
    
    - **child_id**: Optional - analyze photos for specific child only
    - **photo_type**: Optional - analyze specific photo type only
    - **limit**: Maximum number of photos to analyze
    """
    
    # Get unanalyzed photos
    search_params = PhotoSearch(
        child_id=child_id,
        photo_type=photo_type,
        analysis_status=AnalysisStatus.PENDING,
        per_page=limit
    )
    
    photo_list = photo_service.get_photos(db, search_params, current_user.id, current_user.role)
    
    if not photo_list.photos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No unanalyzed photos found"
        )
    
    # Add batch analysis to background tasks
    photo_ids = [p.id for p in photo_list.photos]
    background_tasks.add_task(batch_analyze_background, photo_ids)
    
    return {
        "message": f"Started batch analysis for {len(photo_ids)} photos",
        "photo_ids": photo_ids
    }


async def batch_analyze_background(photo_ids: List[int]):
    """Background task for batch photo analysis"""
    try:
        for photo_id in photo_ids:
            await analyze_photo_background(photo_id)
            # Small delay between analyses
            await asyncio.sleep(0.1)
    except Exception as e:
        # Log error (in production, use proper logging)
        print(f"Batch analysis error: {str(e)}")


@router.get("/ai/model-info")
def get_ai_model_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get information about the AI model"""
    
    return ai_analysis_service.get_model_info()
