"""
Photo service for handling file uploads, storage, and AI analysis
"""

import os
import uuid
import shutil
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
from pathlib import Path
import mimetypes
from PIL import Image
import hashlib

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func, text
from fastapi import HTTPException, UploadFile, status
from fastapi.security import HTTPBearer

from app.models.photo import Photo
from app.models.child import Child
from app.models.user import User
from app.schemas.photo import (
    PhotoUpload, PhotoUpdate, PhotoSearch, PhotoList, PhotoSummary,
    PhotoType, AnalysisStatus, PhotoAnalyticsTrend, PhotoAnalytics
)
from app.core.config import settings


class PhotoService:
    """Service class for photo operations"""
    
    # Allowed file types and extensions
    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}
    ALLOWED_MIME_TYPES = {
        'image/jpeg', 'image/png', 'image/bmp', 
        'image/tiff', 'image/webp'
    }
    
    # Maximum file size (from settings or default 5MB)
    MAX_FILE_SIZE = getattr(settings, 'max_upload_size_mb', 5) * 1024 * 1024
    
    # Upload directory (from settings or default)
    UPLOAD_DIR = Path(getattr(settings, 'upload_dir', 'uploads/photos'))
    
    def __init__(self):
        """Initialize photo service and ensure upload directory exists"""
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    def validate_image_file(self, file: UploadFile) -> Dict[str, Any]:
        """Validate uploaded image file"""
        
        # Check file size
        if hasattr(file, 'size') and file.size > self.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size too large. Maximum size: {self.MAX_FILE_SIZE / (1024*1024):.1f}MB"
            )
        
        # Check file extension
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Filename is required"
            )
        
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in self.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed types: {', '.join(self.ALLOWED_EXTENSIONS)}"
            )
        
        # Check MIME type
        mime_type = file.content_type or mimetypes.guess_type(file.filename)[0]
        if mime_type not in self.ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"MIME type not allowed. Allowed types: {', '.join(self.ALLOWED_MIME_TYPES)}"
            )
        
        return {
            'filename': file.filename,
            'mime_type': mime_type,
            'extension': file_ext
        }
    
    def generate_unique_filename(self, original_filename: str, child_id: int) -> str:
        """Generate a unique filename for the uploaded photo"""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        file_ext = Path(original_filename).suffix.lower()
        
        return f"child_{child_id}_{timestamp}_{unique_id}{file_ext}"
    
    def save_uploaded_file(self, file: UploadFile, filename: str) -> Tuple[str, int]:
        """Save uploaded file to disk and return path and size"""
        
        # Create child-specific subdirectory
        file_path = self.UPLOAD_DIR / filename
        
        try:
            # Save file to disk
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Get file size
            file_size = file_path.stat().st_size
            
            # Validate it's actually an image by trying to open it
            try:
                with Image.open(file_path) as img:
                    # Verify image can be opened
                    img.verify()
            except Exception as e:
                # Delete invalid file
                file_path.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid image file: {str(e)}"
                )
            
            return str(file_path), file_size
            
        except Exception as e:
            # Clean up file if something went wrong
            if file_path.exists():
                file_path.unlink(missing_ok=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save file: {str(e)}"
            )
    
    def create_photo(
        self, 
        db: Session, 
        upload_data: PhotoUpload, 
        file: UploadFile,
        uploaded_by: int
    ) -> Photo:
        """Create a new photo record"""
        
        # Check if child exists
        child = db.query(Child).filter(Child.id == upload_data.child_id).first()
        if not child:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Child not found"
            )
        
        # Validate file
        file_info = self.validate_image_file(file)
        
        # Generate unique filename
        unique_filename = self.generate_unique_filename(file_info['filename'], upload_data.child_id)
        
        # Save file to disk
        file_path, file_size = self.save_uploaded_file(file, unique_filename)
        
        # Create photo record
        photo = Photo(
            child_id=upload_data.child_id,
            filename=unique_filename,
            file_path=file_path,
            file_size=file_size,
            mime_type=file_info['mime_type'],
            photo_type=upload_data.photo_type,
            taken_date=datetime.utcnow(),
            uploaded_by=uploaded_by,
            analysis_status=AnalysisStatus.PENDING,
            notes=upload_data.notes,
            is_analyzed=False,
            is_flagged=False
        )
        
        db.add(photo)
        db.commit()
        db.refresh(photo)
        
        return photo
    
    def get_photo(self, db: Session, photo_id: int, user_id: int, user_role: str) -> Optional[Photo]:
        """Get a single photo by ID with permission check"""
        query = db.query(Photo).filter(Photo.id == photo_id)
        
        # Apply role-based filtering
        if user_role not in ["admin", "doctor"]:
            if user_role == "nurse":
                # Nurses can see photos from their district
                query = query.join(Child).filter(
                    Child.district == db.query(User.district).filter(User.id == user_id).scalar()
                )
            elif user_role == "vht":
                # VHTs can only see photos of children they manage
                query = query.join(Child).filter(Child.vht_user_id == user_id)
        
        return query.first()
    
    def get_photos(
        self, 
        db: Session, 
        search_params: PhotoSearch,
        user_id: int,
        user_role: str
    ) -> PhotoList:
        """Get photos with search and pagination"""
        
        query = db.query(Photo)
        
        # Apply role-based filtering
        if user_role not in ["admin", "doctor"]:
            if user_role == "nurse":
                # Nurses can see photos from their district
                user_district = db.query(User.district).filter(User.id == user_id).scalar()
                query = query.join(Child).filter(Child.district == user_district)
            elif user_role == "vht":
                # VHTs can only see photos of children they manage
                query = query.join(Child).filter(Child.vht_user_id == user_id)
        
        # Apply search filters
        if search_params.child_id:
            query = query.filter(Photo.child_id == search_params.child_id)
        
        if search_params.photo_type:
            query = query.filter(Photo.photo_type == search_params.photo_type)
        
        if search_params.analysis_status:
            query = query.filter(Photo.analysis_status == search_params.analysis_status)
        
        if search_params.is_flagged is not None:
            query = query.filter(Photo.is_flagged == search_params.is_flagged)
        
        if search_params.uploaded_by:
            query = query.filter(Photo.uploaded_by == search_params.uploaded_by)
        
        if search_params.has_analysis is not None:
            query = query.filter(Photo.is_analyzed == search_params.has_analysis)
        
        if search_params.date_from:
            query = query.filter(Photo.taken_date >= search_params.date_from)
        
        if search_params.date_to:
            query = query.filter(Photo.taken_date <= search_params.date_to)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (search_params.page - 1) * search_params.per_page
        photos = query.order_by(desc(Photo.created_at)).offset(offset).limit(search_params.per_page).all()
        
        # Calculate pagination info
        total_pages = (total + search_params.per_page - 1) // search_params.per_page
        
        return PhotoList(
            photos=photos,
            total=total,
            page=search_params.page,
            per_page=search_params.per_page,
            total_pages=total_pages
        )
    
    def update_photo(
        self, 
        db: Session, 
        photo_id: int, 
        update_data: PhotoUpdate,
        user_id: int,
        user_role: str
    ) -> Optional[Photo]:
        """Update photo metadata"""
        
        photo = self.get_photo(db, photo_id, user_id, user_role)
        if not photo:
            return None
        
        # Update fields if provided
        update_fields = update_data.dict(exclude_unset=True)
        for field, value in update_fields.items():
            setattr(photo, field, value)
        
        photo.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(photo)
        
        return photo
    
    def delete_photo(
        self, 
        db: Session, 
        photo_id: int,
        user_id: int,
        user_role: str
    ) -> bool:
        """Delete a photo (soft delete by default)"""
        
        photo = self.get_photo(db, photo_id, user_id, user_role)
        if not photo:
            return False
        
        # For now, we'll do a hard delete but in production consider soft delete
        try:
            # Delete file from disk
            file_path = Path(photo.file_path)
            if file_path.exists():
                file_path.unlink()
            
            # Delete from database
            db.delete(photo)
            db.commit()
            return True
            
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete photo: {str(e)}"
            )
    
    def get_child_photos(
        self, 
        db: Session, 
        child_id: int,
        user_id: int,
        user_role: str
    ) -> List[Photo]:
        """Get all photos for a specific child"""
        
        # Check if child exists and user can access it
        query = db.query(Child).filter(Child.id == child_id)
        
        if user_role not in ["admin", "doctor"]:
            if user_role == "nurse":
                user_district = db.query(User.district).filter(User.id == user_id).scalar()
                query = query.filter(Child.district == user_district)
            elif user_role == "vht":
                query = query.filter(Child.vht_user_id == user_id)
        
        child = query.first()
        if not child:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Child not found or access denied"
            )
        
        # Get photos for this child
        photos = db.query(Photo).filter(Photo.child_id == child_id)\
                  .order_by(desc(Photo.created_at)).all()
        
        return photos
    
    def get_photo_summary(self, db: Session, user_id: int, user_role: str) -> PhotoSummary:
        """Get photo summary statistics"""
        
        query = db.query(Photo)
        
        # Apply role-based filtering
        if user_role not in ["admin", "doctor"]:
            if user_role == "nurse":
                user_district = db.query(User.district).filter(User.id == user_id).scalar()
                query = query.join(Child).filter(Child.district == user_district)
            elif user_role == "vht":
                query = query.join(Child).filter(Child.vht_user_id == user_id)
        
        # Basic counts
        total_photos = query.count()
        analyzed_photos = query.filter(Photo.is_analyzed == True).count()
        flagged_photos = query.filter(Photo.is_flagged == True).count()
        
        # Recent uploads (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_uploads = query.filter(Photo.created_at >= seven_days_ago).count()
        
        # Photos by type
        photos_by_type = {}
        for photo_type in PhotoType:
            count = query.filter(Photo.photo_type == photo_type.value).count()
            photos_by_type[photo_type.value] = count
        
        # Photos by status
        photos_by_status = {}
        for status_type in AnalysisStatus:
            count = query.filter(Photo.analysis_status == status_type.value).count()
            photos_by_status[status_type.value] = count
        
        # Average malnutrition score
        avg_score_result = query.filter(
            Photo.malnutrition_score.isnot(None)
        ).with_entities(func.avg(Photo.malnutrition_score)).scalar()
        
        avg_malnutrition_score = float(avg_score_result) if avg_score_result else None
        
        return PhotoSummary(
            total_photos=total_photos,
            photos_by_type=photos_by_type,
            photos_by_status=photos_by_status,
            analyzed_photos=analyzed_photos,
            flagged_photos=flagged_photos,
            avg_malnutrition_score=avg_malnutrition_score,
            recent_uploads=recent_uploads
        )
    
    def calculate_file_hash(self, file_path: str) -> str:
        """Calculate SHA-256 hash of file for duplicate detection"""
        hash_sha256 = hashlib.sha256()
        try:
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_sha256.update(chunk)
            return hash_sha256.hexdigest()
        except Exception:
            return ""
    
    def get_file_info(self, file_path: str) -> Dict[str, Any]:
        """Get detailed file information"""
        try:
            path = Path(file_path)
            if not path.exists():
                return {}
            
            stat = path.stat()
            file_info = {
                'size_bytes': stat.st_size,
                'size_mb': round(stat.st_size / (1024 * 1024), 2),
                'created': datetime.fromtimestamp(stat.st_ctime),
                'modified': datetime.fromtimestamp(stat.st_mtime),
                'exists': True
            }
            
            # Try to get image dimensions
            try:
                with Image.open(file_path) as img:
                    file_info.update({
                        'width': img.width,
                        'height': img.height,
                        'format': img.format,
                        'mode': img.mode
                    })
            except Exception:
                pass
            
            return file_info
            
        except Exception:
            return {'exists': False}


# Global instance
photo_service = PhotoService()
