"""
Data Preprocessing Service for Malnutrition Detection Training
"""

import os
import json
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
import logging

# Conditional imports
try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

from app.core.logging import get_logger
from app.core.exceptions import AIServiceError, ConfigurationError

logger = get_logger("data_preprocessing")

class DataPreprocessingService:
    """Service for preprocessing training data for malnutrition detection"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or self._get_default_config()
        
        # Validate dependencies
        if not OPENCV_AVAILABLE:
            logger.warning("OpenCV not available, some preprocessing features may be limited")
        
        if not PIL_AVAILABLE:
            logger.warning("PIL not available, some image processing features may be limited")
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default preprocessing configuration"""
        return {
            "image": {
                "target_size": (224, 224),
                "channels": 3,
                "normalize": True,
                "resize_method": "crop_and_resize"
            },
            "face_detection": {
                "enabled": True,
                "cascade_path": "haarcascades/haarcascade_frontalface_default.xml",
                "min_face_size": (50, 50),
                "scale_factor": 1.1,
                "min_neighbors": 5
            },
            "augmentation": {
                "rotation_range": 20,
                "width_shift_range": 0.2,
                "height_shift_range": 0.2,
                "horizontal_flip": True,
                "zoom_range": 0.2,
                "brightness_range": [0.8, 1.2],
                "contrast_range": [0.8, 1.2]
            },
            "quality": {
                "min_resolution": (100, 100),
                "max_file_size": 10 * 1024 * 1024,  # 10MB
                "allowed_formats": ['.jpg', '.jpeg', '.png', '.bmp'],
                "blur_threshold": 100  # Laplacian variance threshold
            }
        }
    
    def preprocess_image(self, image_path: str, target_size: Tuple[int, int] = None) -> np.ndarray:
        """Preprocess a single image for training"""
        try:
            target_size = target_size or self.config["image"]["target_size"]
            
            # Load image
            if OPENCV_AVAILABLE:
                image = cv2.imread(image_path)
                if image is None:
                    raise AIServiceError(f"Could not load image: {image_path}")
                
                # Convert BGR to RGB
                image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            else:
                if not PIL_AVAILABLE:
                    raise ConfigurationError("Neither OpenCV nor PIL available for image processing")
                
                image = Image.open(image_path)
                image = np.array(image)
            
            # Resize image
            image = self._resize_image(image, target_size)
            
            # Normalize if required
            if self.config["image"]["normalize"]:
                image = image.astype(np.float32) / 255.0
            
            return image
            
        except Exception as e:
            logger.error(f"Failed to preprocess image {image_path}: {str(e)}")
            raise AIServiceError(
                f"Image preprocessing failed: {str(e)}",
                error_code="IMAGE_PREPROCESSING_ERROR"
            )
    
    def _resize_image(self, image: np.ndarray, target_size: Tuple[int, int]) -> np.ndarray:
        """Resize image to target size"""
        method = self.config["image"]["resize_method"]
        
        if method == "crop_and_resize":
            return self._crop_and_resize(image, target_size)
        elif method == "pad_and_resize":
            return self._pad_and_resize(image, target_size)
        else:
            # Simple resize
            if OPENCV_AVAILABLE:
                return cv2.resize(image, target_size)
            else:
                pil_image = Image.fromarray(image)
                return np.array(pil_image.resize(target_size))
    
    def _crop_and_resize(self, image: np.ndarray, target_size: Tuple[int, int]) -> np.ndarray:
        """Crop and resize image to maintain aspect ratio"""
        h, w = image.shape[:2]
        target_h, target_w = target_size
        
        # Calculate aspect ratios
        image_aspect = w / h
        target_aspect = target_w / target_h
        
        if image_aspect > target_aspect:
            # Image is wider, crop width
            new_w = int(h * target_aspect)
            start_x = (w - new_w) // 2
            cropped = image[:, start_x:start_x + new_w]
        else:
            # Image is taller, crop height
            new_h = int(w / target_aspect)
            start_y = (h - new_h) // 2
            cropped = image[start_y:start_y + new_h, :]
        
        # Resize to target size
        if OPENCV_AVAILABLE:
            return cv2.resize(cropped, target_size)
        else:
            pil_image = Image.fromarray(cropped)
            return np.array(pil_image.resize(target_size))
    
    def _pad_and_resize(self, image: np.ndarray, target_size: Tuple[int, int]) -> np.ndarray:
        """Pad and resize image to maintain aspect ratio"""
        h, w = image.shape[:2]
        target_h, target_w = target_size
        
        # Calculate scaling factor
        scale = min(target_w / w, target_h / h)
        new_w = int(w * scale)
        new_h = int(h * scale)
        
        # Resize image
        if OPENCV_AVAILABLE:
            resized = cv2.resize(image, (new_w, new_h))
        else:
            pil_image = Image.fromarray(image)
            resized = np.array(pil_image.resize((new_w, new_h)))
        
        # Create padded image
        padded = np.zeros((target_h, target_w, image.shape[2]), dtype=resized.dtype)
        
        # Calculate padding offsets
        y_offset = (target_h - new_h) // 2
        x_offset = (target_w - new_w) // 2
        
        # Place resized image in center
        padded[y_offset:y_offset + new_h, x_offset:x_offset + new_w] = resized
        
        return padded
    
    def detect_faces(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Detect faces in image using OpenCV cascade classifier"""
        if not OPENCV_AVAILABLE:
            logger.warning("OpenCV not available for face detection")
            return []
        
        try:
            # Load cascade classifier
            cascade_path = self.config["face_detection"]["cascade_path"]
            if not os.path.exists(cascade_path):
                logger.warning(f"Face cascade not found at {cascade_path}")
                return []
            
            face_cascade = cv2.CascadeClassifier(cascade_path)
            
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            
            # Detect faces
            faces = face_cascade.detectMultiScale(
                gray,
                scaleFactor=self.config["face_detection"]["scale_factor"],
                minNeighbors=self.config["face_detection"]["min_neighbors"],
                minSize=self.config["face_detection"]["min_face_size"]
            )
            
            return faces.tolist()
            
        except Exception as e:
            logger.error(f"Face detection failed: {str(e)}")
            return []
    
    def extract_face_region(self, image: np.ndarray, face_coords: Tuple[int, int, int, int]) -> np.ndarray:
        """Extract face region from image"""
        x, y, w, h = face_coords
        return image[y:y+h, x:x+w]
    
    def validate_image_quality(self, image_path: str) -> Dict[str, Any]:
        """Validate image quality for training"""
        try:
            # Check file size
            file_size = os.path.getsize(image_path)
            if file_size > self.config["quality"]["max_file_size"]:
                return {
                    "valid": False,
                    "reason": f"File too large: {file_size} bytes"
                }
            
            # Check file format
            file_ext = Path(image_path).suffix.lower()
            if file_ext not in self.config["quality"]["allowed_formats"]:
                return {
                    "valid": False,
                    "reason": f"Unsupported format: {file_ext}"
                }
            
            # Load and check image
            if OPENCV_AVAILABLE:
                image = cv2.imread(image_path)
                if image is None:
                    return {
                        "valid": False,
                        "reason": "Could not load image"
                    }
                
                # Check resolution
                h, w = image.shape[:2]
                min_h, min_w = self.config["quality"]["min_resolution"]
                if h < min_h or w < min_w:
                    return {
                        "valid": False,
                        "reason": f"Resolution too low: {w}x{h}"
                    }
                
                # Check for blur
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
                blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
                if blur_score < self.config["quality"]["blur_threshold"]:
                    return {
                        "valid": False,
                        "reason": f"Image too blurry: {blur_score}"
                    }
                
                return {
                    "valid": True,
                    "resolution": (w, h),
                    "blur_score": blur_score,
                    "file_size": file_size
                }
            
            return {"valid": True, "file_size": file_size}
            
        except Exception as e:
            logger.error(f"Image validation failed: {str(e)}")
            return {
                "valid": False,
                "reason": f"Validation error: {str(e)}"
            }
    
    def organize_training_data(
        self, 
        source_dir: str, 
        target_dir: str, 
        class_mapping: Dict[str, str] = None
    ) -> Dict[str, Any]:
        """Organize training data into class directories"""
        try:
            logger.info(f"Organizing training data from {source_dir} to {target_dir}")
            
            # Default class mapping
            if not class_mapping:
                class_mapping = {
                    "normal": "normal",
                    "moderate": "moderate_malnutrition", 
                    "severe": "severe_malnutrition"
                }
            
            # Create target directory structure
            target_path = Path(target_dir)
            target_path.mkdir(parents=True, exist_ok=True)
            
            # Create class directories
            for class_name in class_mapping.values():
                (target_path / class_name).mkdir(exist_ok=True)
            
            # Process images
            source_path = Path(source_dir)
            processed_count = 0
            skipped_count = 0
            validation_results = []
            
            for image_file in source_path.rglob("*"):
                if image_file.is_file() and image_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.bmp']:
                    # Validate image
                    validation = self.validate_image_quality(str(image_file))
                    validation_results.append({
                        "file": str(image_file),
                        "validation": validation
                    })
                    
                    if not validation["valid"]:
                        logger.warning(f"Skipping {image_file}: {validation['reason']}")
                        skipped_count += 1
                        continue
                    
                    # Determine class (simplified - would need metadata or naming convention)
                    # This is a placeholder - in real implementation, you'd have metadata
                    class_name = self._determine_class(str(image_file), class_mapping)
                    
                    # Copy to appropriate directory
                    target_file = target_path / class_name / image_file.name
                    target_file.parent.mkdir(exist_ok=True)
                    
                    # Copy file
                    import shutil
                    shutil.copy2(image_file, target_file)
                    processed_count += 1
            
            # Save organization report
            report = {
                "source_dir": source_dir,
                "target_dir": target_dir,
                "processed_count": processed_count,
                "skipped_count": skipped_count,
                "class_mapping": class_mapping,
                "validation_results": validation_results,
                "timestamp": datetime.now().isoformat()
            }
            
            report_path = target_path / "organization_report.json"
            with open(report_path, 'w') as f:
                json.dump(report, f, indent=2)
            
            logger.info(f"Data organization completed: {processed_count} images processed, {skipped_count} skipped")
            return report
            
        except Exception as e:
            logger.error(f"Data organization failed: {str(e)}")
            raise AIServiceError(
                f"Data organization failed: {str(e)}",
                error_code="DATA_ORGANIZATION_ERROR"
            )
    
    def _determine_class(self, image_path: str, class_mapping: Dict[str, str]) -> str:
        """Determine class for an image (placeholder implementation)"""
        # This is a simplified implementation
        # In a real scenario, you'd have metadata or naming conventions
        
        filename = Path(image_path).name.lower()
        
        if "normal" in filename:
            return class_mapping["normal"]
        elif "moderate" in filename:
            return class_mapping["moderate"]
        elif "severe" in filename:
            return class_mapping["severe"]
        else:
            # Default to normal if unclear
            return class_mapping["normal"]
    
    def create_data_splits(
        self, 
        data_dir: str, 
        train_ratio: float = 0.7, 
        val_ratio: float = 0.2, 
        test_ratio: float = 0.1
    ) -> Dict[str, Any]:
        """Create train/validation/test splits from organized data"""
        try:
            logger.info(f"Creating data splits from {data_dir}")
            
            data_path = Path(data_dir)
            splits = {
                "train": [],
                "validation": [],
                "test": []
            }
            
            # Process each class directory
            for class_dir in data_path.iterdir():
                if class_dir.is_dir():
                    class_name = class_dir.name
                    images = list(class_dir.glob("*"))
                    
                    # Shuffle images
                    import random
                    random.shuffle(images)
                    
                    # Calculate split indices
                    total_images = len(images)
                    train_end = int(total_images * train_ratio)
                    val_end = train_end + int(total_images * val_ratio)
                    
                    # Split images
                    train_images = images[:train_end]
                    val_images = images[train_end:val_end]
                    test_images = images[val_end:]
                    
                    # Add to splits
                    splits["train"].extend([(str(img), class_name) for img in train_images])
                    splits["validation"].extend([(str(img), class_name) for img in val_images])
                    splits["test"].extend([(str(img), class_name) for img in test_images])
            
            # Save split information
            split_info = {
                "splits": splits,
                "ratios": {
                    "train": train_ratio,
                    "validation": val_ratio,
                    "test": test_ratio
                },
                "total_images": sum(len(split) for split in splits.values()),
                "timestamp": datetime.now().isoformat()
            }
            
            split_path = data_path / "data_splits.json"
            with open(split_path, 'w') as f:
                json.dump(split_info, f, indent=2)
            
            logger.info(f"Data splits created: {len(splits['train'])} train, {len(splits['validation'])} val, {len(splits['test'])} test")
            return split_info
            
        except Exception as e:
            logger.error(f"Data splitting failed: {str(e)}")
            raise AIServiceError(
                f"Data splitting failed: {str(e)}",
                error_code="DATA_SPLITTING_ERROR"
            )
