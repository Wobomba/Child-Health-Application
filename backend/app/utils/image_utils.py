"""
Image processing and validation utilities
"""

import io
import os
from typing import Tuple, Dict, Any, Optional, List
from pathlib import Path
from PIL import Image, ImageOps, ExifTags
import numpy as np
from fastapi import HTTPException, status


class ImageProcessor:
    """Utility class for image processing and validation"""
    
    # Standard sizes for different photo types
    STANDARD_SIZES = {
        'face': (512, 512),
        'full_body': (512, 768),
        'clinical': (1024, 768),
        'growth_chart': (1024, 1024),
        'thumbnail': (150, 150)
    }
    
    # Quality settings
    JPEG_QUALITY = 85
    WEBP_QUALITY = 80
    
    def __init__(self):
        """Initialize image processor"""
        pass
    
    def validate_image_content(self, image_data: bytes) -> Dict[str, Any]:
        """Validate image content and extract metadata"""
        try:
            # Try to open the image
            image = Image.open(io.BytesIO(image_data))
            
            # Get basic info
            info = {
                'format': image.format,
                'mode': image.mode,
                'size': image.size,
                'width': image.size[0],
                'height': image.size[1],
                'has_transparency': image.mode in ('RGBA', 'LA') or 'transparency' in image.info,
                'is_animated': getattr(image, 'is_animated', False),
                'n_frames': getattr(image, 'n_frames', 1)
            }
            
            # Check if image is too small
            min_width, min_height = 100, 100
            if image.size[0] < min_width or image.size[1] < min_height:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Image too small. Minimum size: {min_width}x{min_height}"
                )
            
            # Check if image is too large
            max_width, max_height = 4096, 4096
            if image.size[0] > max_width or image.size[1] > max_height:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Image too large. Maximum size: {max_width}x{max_height}"
                )
            
            # Extract EXIF data if available
            exif_data = {}
            if hasattr(image, '_getexif') and image._getexif() is not None:
                exif = image._getexif()
                for tag_id, value in exif.items():
                    tag = ExifTags.TAGS.get(tag_id, tag_id)
                    exif_data[tag] = value
            
            info['exif'] = exif_data
            
            # Check image quality (basic blur detection)
            try:
                # Convert to grayscale for analysis
                gray = image.convert('L')
                gray_array = np.array(gray)
                
                # Calculate Laplacian variance (blur metric)
                laplacian_var = np.var(self._laplacian_kernel(gray_array))
                info['sharpness_score'] = float(laplacian_var)
                info['is_blurry'] = laplacian_var < 100  # Threshold for blur detection
                
            except Exception:
                info['sharpness_score'] = None
                info['is_blurry'] = False
            
            return info
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image file: {str(e)}"
            )
    
    def _laplacian_kernel(self, image_array: np.ndarray) -> np.ndarray:
        """Apply Laplacian kernel for edge detection (blur measurement)"""
        kernel = np.array([[0, -1, 0], [-1, 4, -1], [0, -1, 0]])
        # Simple convolution
        result = np.zeros_like(image_array)
        for i in range(1, image_array.shape[0] - 1):
            for j in range(1, image_array.shape[1] - 1):
                result[i, j] = np.sum(kernel * image_array[i-1:i+2, j-1:j+2])
        return result
    
    def normalize_image_orientation(self, image: Image.Image) -> Image.Image:
        """Fix image orientation based on EXIF data"""
        try:
            # Use ImageOps to handle EXIF orientation
            return ImageOps.exif_transpose(image)
        except Exception:
            # If EXIF processing fails, return original
            return image
    
    def resize_image(
        self, 
        image: Image.Image, 
        target_size: Tuple[int, int],
        maintain_aspect_ratio: bool = True,
        crop_to_fit: bool = False
    ) -> Image.Image:
        """Resize image to target size"""
        
        if maintain_aspect_ratio:
            if crop_to_fit:
                # Resize and crop to exact size
                return ImageOps.fit(image, target_size, Image.Resampling.LANCZOS)
            else:
                # Resize maintaining aspect ratio (may not match exact target size)
                image.thumbnail(target_size, Image.Resampling.LANCZOS)
                return image
        else:
            # Stretch to exact size (may distort)
            return image.resize(target_size, Image.Resampling.LANCZOS)
    
    def create_thumbnail(self, image: Image.Image, size: Tuple[int, int] = None) -> Image.Image:
        """Create a thumbnail of the image"""
        if size is None:
            size = self.STANDARD_SIZES['thumbnail']
        
        return self.resize_image(image, size, maintain_aspect_ratio=True, crop_to_fit=True)
    
    def optimize_for_storage(self, image: Image.Image, format: str = 'JPEG') -> Tuple[bytes, str]:
        """Optimize image for storage"""
        
        # Convert RGBA to RGB for JPEG
        if format.upper() == 'JPEG' and image.mode in ('RGBA', 'LA'):
            # Create white background
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'RGBA':
                background.paste(image, mask=image.split()[-1])  # Use alpha channel as mask
            else:
                background.paste(image)
            image = background
        
        # Save to bytes
        output = io.BytesIO()
        
        if format.upper() == 'JPEG':
            image.save(
                output, 
                format='JPEG', 
                quality=self.JPEG_QUALITY,
                optimize=True,
                progressive=True
            )
            mime_type = 'image/jpeg'
        elif format.upper() == 'WEBP':
            image.save(
                output,
                format='WEBP',
                quality=self.WEBP_QUALITY,
                optimize=True
            )
            mime_type = 'image/webp'
        elif format.upper() == 'PNG':
            image.save(
                output,
                format='PNG',
                optimize=True
            )
            mime_type = 'image/png'
        else:
            raise ValueError(f"Unsupported format: {format}")
        
        return output.getvalue(), mime_type
    
    def detect_faces(self, image: Image.Image) -> List[Dict[str, Any]]:
        """Basic face detection (placeholder for more advanced detection)"""
        # This is a placeholder. In a real implementation, you might use:
        # - OpenCV's Haar cascades
        # - dlib's face detector
        # - Deep learning models like MTCNN
        
        # For now, return empty list (no faces detected)
        return []
    
    def analyze_composition(self, image: Image.Image) -> Dict[str, Any]:
        """Analyze image composition for photo quality"""
        
        # Convert to numpy array for analysis
        img_array = np.array(image.convert('RGB'))
        
        analysis = {
            'brightness': float(np.mean(img_array)),
            'contrast': float(np.std(img_array)),
            'saturation': 0.0,  # Placeholder
            'dominant_colors': [],  # Placeholder
            'quality_score': 0.0  # Placeholder
        }
        
        # Calculate saturation for RGB
        if len(img_array.shape) == 3 and img_array.shape[2] == 3:
            # Convert to HSV to get saturation
            hsv_array = self._rgb_to_hsv(img_array)
            analysis['saturation'] = float(np.mean(hsv_array[:, :, 1]))
        
        # Simple quality score based on brightness and contrast
        # Good photos typically have balanced brightness (not too dark/bright)
        # and reasonable contrast
        brightness_score = 1.0 - abs(analysis['brightness'] - 128) / 128
        contrast_score = min(analysis['contrast'] / 50, 1.0)  # Normalize contrast
        
        analysis['quality_score'] = (brightness_score + contrast_score) / 2
        
        return analysis
    
    def _rgb_to_hsv(self, rgb_array: np.ndarray) -> np.ndarray:
        """Convert RGB array to HSV (simplified implementation)"""
        # Normalize RGB values
        rgb_normalized = rgb_array / 255.0
        
        # Initialize HSV array
        hsv = np.zeros_like(rgb_normalized)
        
        # Get min and max values
        c_max = np.max(rgb_normalized, axis=2)
        c_min = np.min(rgb_normalized, axis=2)
        delta = c_max - c_min
        
        # Value (brightness)
        hsv[:, :, 2] = c_max
        
        # Saturation
        mask = c_max != 0
        hsv[:, :, 1] = np.where(mask, delta / c_max, 0)
        
        # Hue (simplified)
        hsv[:, :, 0] = 0  # Placeholder for hue calculation
        
        return hsv
    
    def prepare_for_ai_analysis(self, image: Image.Image, target_size: Tuple[int, int] = (224, 224)) -> np.ndarray:
        """Prepare image for AI model input"""
        
        # Resize image
        resized = self.resize_image(image, target_size, maintain_aspect_ratio=True, crop_to_fit=True)
        
        # Convert to RGB if needed
        if resized.mode != 'RGB':
            resized = resized.convert('RGB')
        
        # Convert to numpy array and normalize
        img_array = np.array(resized, dtype=np.float32)
        
        # Normalize to [0, 1]
        img_array = img_array / 255.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    
    def check_image_safety(self, image: Image.Image) -> Dict[str, Any]:
        """Basic safety checks for uploaded images"""
        
        safety_report = {
            'is_safe': True,
            'warnings': [],
            'issues': []
        }
        
        # Check if image is too dark (might indicate poor lighting)
        img_array = np.array(image.convert('L'))  # Convert to grayscale
        avg_brightness = np.mean(img_array)
        
        if avg_brightness < 30:
            safety_report['warnings'].append('Image appears very dark - poor lighting conditions')
        elif avg_brightness > 225:
            safety_report['warnings'].append('Image appears overexposed - too bright')
        
        # Check image size ratio (extremely elongated images might be problematic)
        width, height = image.size
        aspect_ratio = max(width, height) / min(width, height)
        
        if aspect_ratio > 5:
            safety_report['warnings'].append('Unusual aspect ratio - image appears very elongated')
        
        # Check for minimal content (mostly single color)
        if np.std(img_array) < 10:
            safety_report['issues'].append('Image appears to have very low variation - possibly blank or corrupted')
            safety_report['is_safe'] = False
        
        return safety_report


# Global instance
image_processor = ImageProcessor()
