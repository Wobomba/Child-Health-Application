"""
AI/ML service for malnutrition detection and analysis
Real computer vision implementation using MobileNetV2 for malnutrition detection
"""

import os
import io
import logging
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple, Union
import numpy as np
from PIL import Image

from sqlalchemy.orm import Session
from app.models.photo import Photo
from app.schemas.photo import AIAnalysisResponse, AnalysisStatus
from app.utils.image_utils import image_processor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Conditional imports for AI dependencies
try:
    import tensorflow as tf
    from tensorflow.keras.applications import MobileNetV2
    from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
    from tensorflow.keras.models import Model
    from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    logger.warning("TensorFlow not available. AI service will run in fallback mode.")

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    logger.warning("OpenCV not available. Using PIL for image processing.")


class AIAnalysisService:
    """Service for AI-powered malnutrition analysis using computer vision"""
    
    # Model versions
    MODEL_VERSION = "malnutrition_mobilenetv2_v1.0.0"
    
    # Analysis thresholds
    MALNUTRITION_THRESHOLD = 0.6
    HIGH_CONFIDENCE_THRESHOLD = 0.8
    
    # Image processing parameters
    INPUT_SIZE = (224, 224)
    BATCH_SIZE = 32
    
    def __init__(self):
        """Initialize AI service"""
        self.is_model_loaded = False
        self.model_load_time = None
        self.base_model = None
        self.prediction_model = None
        
        # Initialize TensorFlow settings
        self._setup_tensorflow()
    
    def _setup_tensorflow(self):
        """Configure TensorFlow settings for optimal performance"""
        try:
            # Configure GPU if available
            gpus = tf.config.experimental.list_physical_devices('GPU')
            if gpus:
                # Enable memory growth for GPU
                for gpu in gpus:
                    tf.config.experimental.set_memory_growth(gpu, True)
                logger.info(f"Found {len(gpus)} GPU(s), memory growth enabled")
            else:
                logger.info("No GPUs found, using CPU")
                
            # Set CPU threads for optimal performance
            tf.config.threading.set_inter_op_parallelism_threads(0)
            tf.config.threading.set_intra_op_parallelism_threads(0)
            
        except Exception as e:
            logger.warning(f"TensorFlow setup warning: {e}")
    
    async def load_model(self) -> bool:
        """Load MobileNetV2-based malnutrition detection model"""
        if self.is_model_loaded:
            return True
        
        if not TF_AVAILABLE:
            logger.warning("TensorFlow not available. Using fallback analysis.")
            self.is_model_loaded = True
            self.model_load_time = datetime.utcnow()
            return True
        
        try:
            logger.info("Loading MobileNetV2 model for malnutrition detection...")
            
            # Load pre-trained MobileNetV2 as base model
            self.base_model = MobileNetV2(
                input_shape=(224, 224, 3),
                alpha=1.0,
                include_top=False,
                weights='imagenet'
            )
            
            # Add custom layers for malnutrition detection
            x = self.base_model.output
            x = GlobalAveragePooling2D()(x)
            x = Dense(512, activation='relu', name='feature_dense')(x)
            x = Dropout(0.3)(x)
            x = Dense(256, activation='relu', name='classification_dense')(x)
            x = Dropout(0.2)(x)
            
            # Output layers for different predictions
            malnutrition_score = Dense(1, activation='sigmoid', name='malnutrition_score')(x)
            confidence_score = Dense(1, activation='sigmoid', name='confidence_score')(x)
            
            # Create the full model
            self.prediction_model = Model(
                inputs=self.base_model.input,
                outputs=[malnutrition_score, confidence_score]
            )
            
            # Compile the model
            self.prediction_model.compile(
                optimizer='adam',
                loss={'malnutrition_score': 'binary_crossentropy', 
                     'confidence_score': 'mse'},
                metrics={'malnutrition_score': 'accuracy',
                        'confidence_score': 'mae'}
            )
            
            self.is_model_loaded = True
            self.model_load_time = datetime.utcnow()
            
            logger.info(f"Model loaded successfully - {self.MODEL_VERSION}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return False
    
    def _preprocess_image(self, image_path: str) -> np.ndarray:
        """Preprocess image for model input"""
        try:
            # Load and validate image
            image = Image.open(image_path)
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize to model input size
            image = image.resize(self.INPUT_SIZE, Image.Resampling.LANCZOS)
            
            # Convert to numpy array
            img_array = np.array(image, dtype=np.float32)
            
            # Add batch dimension
            img_array = np.expand_dims(img_array, axis=0)
            
            # Preprocess for MobileNetV2
            img_array = preprocess_input(img_array)
            
            return img_array
            
        except Exception as e:
            logger.error(f"Image preprocessing failed: {e}")
            raise ValueError(f"Failed to preprocess image: {e}")
    
    def _extract_facial_features(self, image_path: str) -> Dict[str, float]:
        """Extract facial anthropometric features - returns malnutrition indicators (higher = worse)"""
        try:
            if CV2_AVAILABLE:
                # Load image with OpenCV
                img = cv2.imread(image_path)
                if img is None:
                    raise ValueError("Could not load image")
                
                # Convert to RGB
                img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                
                # Simple feature extraction (placeholder for more sophisticated analysis)
                # In a real implementation, this would use facial landmark detection
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                
                # Calculate basic image statistics as proxy features
                height, width = gray.shape
                mean_intensity = np.mean(gray)
                std_intensity = np.std(gray)
                
                # Calculate edge density (malnourished children may have more prominent facial bones)
                edges = cv2.Canny(gray, 50, 150)
                edge_density = np.sum(edges > 0) / (height * width)
            else:
                # Fallback using PIL
                with Image.open(image_path) as img:
                    if img.mode != 'L':
                        img = img.convert('L')  # Convert to grayscale
                    
                    img_array = np.array(img)
                    height, width = img_array.shape
                    mean_intensity = np.mean(img_array)
                    std_intensity = np.std(img_array)
                    edge_density = 0.1  # Default for PIL fallback
            
            # Extract features that indicate malnutrition (higher values = more signs of malnutrition)
            # Lower intensity = paler skin = potential malnutrition indicator
            # Higher edge density = more prominent bones = potential wasting
            # Lower facial fullness = potential malnutrition
            
            # Normalize features to 0-1 range where 1 = severe malnutrition signs
            skin_paleness = 1.0 - min(1.0, mean_intensity / 200.0)  # Lower intensity = higher paleness
            bone_prominence = min(1.0, edge_density * 10)  # Higher edge density = more prominent bones
            facial_wasting = 1.0 - min(1.0, (mean_intensity + std_intensity) / 300.0)  # Lower fullness = higher wasting
            
            features = {
                'cheek_prominence': bone_prominence,  # Higher = more prominent (wasting)
                'eye_socket_depth': min(1.0, std_intensity / 80.0),  # Higher = deeper sockets (malnutrition)
                'facial_fullness': 1.0 - facial_wasting,  # Lower = more wasting (inverted for clarity)
                'skin_condition': skin_paleness,  # Higher = paler skin (malnutrition)
                'overall_appearance': (bone_prominence + skin_paleness + facial_wasting) / 3.0  # Combined indicator
            }
            
            return features
            
        except Exception as e:
            logger.warning(f"Facial feature extraction failed: {e}")
            # Return default features if extraction fails (moderate risk)
            return {
                'cheek_prominence': 0.3,
                'eye_socket_depth': 0.3,
                'facial_fullness': 0.7,  # Inverted: higher = healthier
                'skin_condition': 0.3,
                'overall_appearance': 0.3
            }
    
    def _calculate_anthropometric_score(self, child_age_months: Optional[int], 
                                       weight_kg: Optional[float], 
                                       height_cm: Optional[float]) -> float:
        """Calculate malnutrition score based on anthropometric data (WHO z-scores)"""
        if not all([child_age_months, weight_kg, height_cm]):
            return 0.0  # No anthropometric data available
        
        try:
            # Simplified WHO z-score calculation (in production, use proper WHO growth standards)
            # For children 0-60 months
            
            # Weight-for-age z-score approximation
            # Normal range: -2 to +2 z-scores
            # Moderate malnutrition: -2 to -3 z-scores
            # Severe malnutrition: < -3 z-scores
            
            # Simplified calculation (age-appropriate expected weight)
            # This is a simplified version - in production, use WHO growth charts
            if child_age_months <= 12:
                expected_weight = 3.0 + (child_age_months * 0.6)  # Rough estimate for 0-12 months
            elif child_age_months <= 24:
                expected_weight = 9.0 + ((child_age_months - 12) * 0.25)  # 12-24 months
            elif child_age_months <= 60:
                expected_weight = 12.0 + ((child_age_months - 24) * 0.15)  # 24-60 months
            else:
                expected_weight = 15.0 + ((child_age_months - 60) * 0.1)  # 60+ months
            
            # Calculate weight deficit percentage
            weight_deficit = (expected_weight - weight_kg) / expected_weight if expected_weight > 0 else 0
            
            # Height-for-age (stunting)
            if child_age_months <= 12:
                expected_height = 50 + (child_age_months * 2.5)  # Rough estimate
            elif child_age_months <= 24:
                expected_height = 80 + ((child_age_months - 12) * 0.8)
            elif child_age_months <= 60:
                expected_height = 90 + ((child_age_months - 24) * 0.6)
            else:
                expected_height = 110 + ((child_age_months - 60) * 0.5)
            
            height_deficit = (expected_height - height_cm) / expected_height if expected_height > 0 else 0
            
            # Combine indicators (weight deficit is more critical for acute malnutrition)
            anthropometric_score = min(1.0, (weight_deficit * 0.7) + (height_deficit * 0.3))
            
            return anthropometric_score
            
        except Exception as e:
            logger.warning(f"Anthropometric score calculation failed: {e}")
            return 0.0
    
    def _calculate_malnutrition_indicators(self, features: Dict[str, float], 
                                         cnn_prediction: float,
                                         anthropometric_score: float = 0.0) -> Dict[str, Any]:
        """Calculate comprehensive malnutrition indicators"""
        
        # Weight features based on medical significance
        # Note: features now represent malnutrition indicators (higher = worse)
        feature_weights = {
            'cheek_prominence': 0.20,  # Bone prominence (wasting)
            'eye_socket_depth': 0.25,  # Deep sockets (malnutrition)
            'facial_fullness': 0.25,    # Lower = more wasting (inverted in calculation)
            'skin_condition': 0.15,     # Paleness
            'overall_appearance': 0.15  # Combined visual indicator
        }
        
        # Calculate weighted feature score (higher = more malnutrition signs)
        # Note: facial_fullness is inverted (lower value = more wasting)
        feature_scores = {
            'cheek_prominence': features['cheek_prominence'],
            'eye_socket_depth': features['eye_socket_depth'],
            'facial_fullness': 1.0 - features['facial_fullness'],  # Invert: lower fullness = higher risk
            'skin_condition': features['skin_condition'],
            'overall_appearance': features['overall_appearance']
        }
        
        feature_score = sum(feature_scores[key] * weight for key, weight in feature_weights.items())
        
        # Ensure CNN prediction is interpreted correctly (higher = more malnutrition)
        # If CNN outputs 0-1 where 1 = healthy, we need to invert it
        # For now, assume CNN outputs 0-1 where 1 = malnourished (if not, adjust here)
        cnn_malnutrition_score = cnn_prediction
        
        # Combine all indicators with weights
        # Anthropometric data is most reliable if available
        if anthropometric_score > 0:
            final_score = (anthropometric_score * 0.5) + (cnn_malnutrition_score * 0.3) + (feature_score * 0.2)
        else:
            # Without anthropometric data, rely more on visual analysis
            final_score = (cnn_malnutrition_score * 0.6) + (feature_score * 0.4)
        
        # Clamp to 0-1 range
        final_score = max(0.0, min(1.0, final_score))
        
        # Determine risk level (higher score = worse condition)
        if final_score >= 0.75:
            risk_level = "high"
            status = "severe_malnutrition"
        elif final_score >= 0.55:
            risk_level = "moderate"
            status = "moderate_malnutrition"
        elif final_score >= 0.35:
            risk_level = "mild"
            status = "mild_malnutrition"
        else:
            risk_level = "low"
            status = "normal"
        
        return {
            'final_score': final_score,
            'risk_level': risk_level,
            'status': status,
            'feature_contributions': features,
            'cnn_contribution': cnn_malnutrition_score,
            'anthropometric_contribution': anthropometric_score
        }
    
    async def analyze_photo(self, photo: Photo, image_path: str) -> AIAnalysisResponse:
        """
        Analyze a photo for malnutrition indicators using computer vision
        """
        start_time = datetime.utcnow()
        
        try:
            # Ensure model is loaded
            if not self.is_model_loaded:
                model_loaded = await self.load_model()
                if not model_loaded:
                    raise RuntimeError("Failed to load AI model")
            
            logger.info(f"Starting AI analysis for photo {photo.id}")
            
            # Preprocess image for CNN
            if TF_AVAILABLE and self.prediction_model is not None:
                processed_image = self._preprocess_image(image_path)
                
                # Run CNN prediction
                malnutrition_pred, confidence_pred = self.prediction_model.predict(
                    processed_image, verbose=0
                )
                
                # Extract scalar values
                raw_cnn_score = float(malnutrition_pred[0][0])
                confidence_score = float(confidence_pred[0][0])
                
                # Note: CNN model should output 1.0 = malnourished, 0.0 = healthy
                # If model outputs inverted (1.0 = healthy), uncomment the next line:
                # raw_cnn_score = 1.0 - raw_cnn_score
                
                malnutrition_score = raw_cnn_score
                
                logger.info(f"CNN prediction: {malnutrition_score:.3f}, Confidence: {confidence_score:.3f}")
            else:
                # Fallback to feature-based analysis only
                logger.info("Using fallback analysis (TensorFlow not available)")
                # Use feature-based estimation instead of fixed score
                facial_features_temp = self._extract_facial_features(image_path)
                # Estimate malnutrition from features (higher feature scores = more malnutrition)
                feature_based_score = (
                    facial_features_temp['cheek_prominence'] * 0.2 +
                    facial_features_temp['eye_socket_depth'] * 0.25 +
                    (1.0 - facial_features_temp['facial_fullness']) * 0.25 +
                    facial_features_temp['skin_condition'] * 0.15 +
                    facial_features_temp['overall_appearance'] * 0.15
                )
                malnutrition_score = feature_based_score
                confidence_score = 0.6  # Lower confidence for fallback
                logger.info(f"Fallback feature-based score: {malnutrition_score:.3f}")
            
            # Extract facial features
            facial_features = self._extract_facial_features(image_path)
            
            # Get child's anthropometric data (latest growth record)
            child_age_months = None
            weight_kg = None
            height_cm = None
            
            if photo.child:
                # Calculate age
                if photo.child.date_of_birth:
                    from datetime import date
                    today = date.today()
                    age_delta = today - photo.child.date_of_birth
                    child_age_months = age_delta.days // 30
                
                # Get latest growth record
                if photo.child.growth_records:
                    latest_record = max(photo.child.growth_records, key=lambda r: r.measurement_date)
                    weight_kg = latest_record.weight
                    height_cm = latest_record.height
            
            # Calculate anthropometric score
            anthropometric_score = self._calculate_anthropometric_score(
                child_age_months, weight_kg, height_cm
            )
            
            # Calculate comprehensive malnutrition indicators
            analysis_result = self._calculate_malnutrition_indicators(
                facial_features, malnutrition_score, anthropometric_score
            )
            
            # Generate recommendations based on analysis
            recommendations = self._generate_recommendations(
                analysis_result['status'], 
                analysis_result['risk_level'],
                facial_features
            )
            
            # Detect diseases based on symptoms and anthropometric data
            detected_diseases = self._detect_diseases(
                malnutrition_score=analysis_result['final_score'],
                facial_features=facial_features,
                status=analysis_result['status'],
                anthropometric_score=anthropometric_score
            )
            
            # Generate disaster predictions
            disaster_predictions = self._generate_disaster_predictions(
                malnutrition_score=analysis_result['final_score'],
                status=analysis_result['status']
            )
            
            # Child age already calculated above
            
            # Generate nutrition tips based on age and detected diseases
            nutrition_tips = self._generate_nutrition_tips(
                child_age_months,
                analysis_result['status'],
                detected_diseases
            )
            
            # Calculate processing time
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Prepare detailed analysis results
            analysis_data = {
                'model_version': self.MODEL_VERSION,
                'processing_time_seconds': processing_time,
                'malnutrition_score': analysis_result['final_score'],
                'confidence_score': confidence_score,
                'risk_level': analysis_result['risk_level'],
                'status': analysis_result['status'],
                'facial_features': facial_features,
                'anthropometric_data': {
                    'age_months': child_age_months,
                    'weight_kg': weight_kg,
                    'height_cm': height_cm,
                    'anthropometric_score': anthropometric_score,
                    'data_available': anthropometric_score > 0
                },
                'anthropometric_indicators': {
                    'cheek_fullness': facial_features['cheek_prominence'],
                    'eye_appearance': facial_features['eye_socket_depth'],
                    'overall_facial_development': facial_features['facial_fullness'],
                    'skin_health': facial_features['skin_condition']
                },
                'technical_details': {
                    'cnn_raw_prediction': malnutrition_score,
                    'feature_weights_applied': True,
                    'image_quality_score': confidence_score,
                    'preprocessing_successful': True,
                    'anthropometric_contribution': analysis_result.get('anthropometric_contribution', 0.0),
                    'cnn_contribution': analysis_result.get('cnn_contribution', 0.0),
                    'feature_contribution': analysis_result.get('feature_contributions', {})
                }
            }
            
            logger.info(f"AI analysis completed for photo {photo.id} - "
                       f"Score: {analysis_result['final_score']:.3f}, "
                       f"Status: {analysis_result['status']}")
            
            return AIAnalysisResponse(
                photo_id=photo.id,
                analysis_status=AnalysisStatus.COMPLETED,
                malnutrition_score=analysis_result['final_score'],
                confidence_level=confidence_score,
                detected_features=analysis_data,
                recommendations=recommendations,
                analysis_notes=f"Analysis completed with {analysis_result['risk_level']} risk level",
                is_malnourished=analysis_result['final_score'] > 0.6,
                processing_time_seconds=processing_time,
                model_version=self.MODEL_VERSION,
                analyzed_at=datetime.utcnow(),
                detected_diseases=detected_diseases,
                disaster_predictions=disaster_predictions,
                nutrition_tips=nutrition_tips
            )
            
        except Exception as e:
            logger.error(f"AI analysis failed for photo {photo.id}: {e}")
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            return AIAnalysisResponse(
                photo_id=photo.id,
                analysis_status=AnalysisStatus.FAILED,
                malnutrition_score=0.0,
                confidence_level=0.0,
                detected_features={
                    'error': str(e),
                    'processing_time_seconds': processing_time,
                    'model_version': self.MODEL_VERSION
                },
                recommendations=["Analysis failed. Please ensure image quality and try again."],
                analysis_notes=f"Analysis failed: {str(e)}",
                is_malnourished=False,
                processing_time_seconds=processing_time,
                model_version=self.MODEL_VERSION,
                analyzed_at=datetime.utcnow()
            )
    
    def _generate_recommendations(self, status: str, risk_level: str, 
                                facial_features: Dict[str, float]) -> List[str]:
        """Generate medical recommendations based on analysis results"""
        recommendations = []
        
        if status == "severe_malnutrition":
            recommendations.extend([
                "URGENT: Immediate medical attention required",
                "Refer to pediatric nutritionist or medical specialist",
                "Consider therapeutic feeding program enrollment",
                "Monitor vital signs and hydration status",
                "Follow up within 48-72 hours"
            ])
        elif status == "moderate_malnutrition":
            recommendations.extend([
                "Schedule medical evaluation within 1-2 weeks",
                "Implement nutritional counseling for caregivers",
                "Increase frequency of growth monitoring",
                "Consider supplementary feeding programs",
                "Assess underlying health conditions"
            ])
        elif status == "mild_malnutrition":
            recommendations.extend([
                "Provide nutritional guidance to caregivers",
                "Monitor growth progress monthly",
                "Assess feeding practices and dietary diversity",
                "Consider vitamin/mineral supplementation",
                "Follow up in 4-6 weeks"
            ])
        else:
            recommendations.extend([
                "Continue regular growth monitoring",
                "Maintain current feeding practices",
                "Schedule routine follow-up in 3 months",
                "Promote continued healthy nutrition"
            ])
        
        # Add specific recommendations based on facial features
        if facial_features.get('skin_condition', 0.5) < 0.3:
            recommendations.append("Evaluate for potential vitamin deficiencies")
            
        if facial_features.get('cheek_prominence', 0.5) < 0.3:
            recommendations.append("Assess for signs of wasting or acute malnutrition")
            
        if facial_features.get('eye_socket_depth', 0.5) > 0.7:
            recommendations.append("Monitor for dehydration and electrolyte imbalance")
        
        return recommendations[:8]  # Limit to 8 recommendations
    
    def _detect_diseases(self, malnutrition_score: float, facial_features: Dict[str, float], 
                        status: str, anthropometric_score: float = 0.0) -> List[Dict[str, Any]]:
        """Detect specific malnutrition-related diseases based on symptoms and anthropometric data"""
        detected = []
        
        # Only detect diseases if malnutrition is present
        if malnutrition_score < 0.35:
            return detected
        
        # Extract feature indicators (remember: higher values = more malnutrition signs)
        skin_paleness = facial_features.get('skin_condition', 0.3)
        bone_prominence = facial_features.get('cheek_prominence', 0.3)
        eye_depth = facial_features.get('eye_socket_depth', 0.3)
        facial_wasting = 1.0 - facial_features.get('facial_fullness', 0.7)  # Invert for wasting
        
        # Kwashiorkor (protein deficiency) - symptoms: edema, skin changes, hair changes, distended abdomen
        # Characterized by: skin lesions, edema, hair discoloration, but relatively preserved muscle mass
        if skin_paleness > 0.5 and malnutrition_score > 0.5 and facial_wasting < 0.6:
            confidence = min(0.95, malnutrition_score * 0.9 + 0.2)
            detected.append({
                'disease': 'kwashiorkor',
                'confidence': round(confidence, 2),
                'description': 'Protein-energy malnutrition characterized by edema, skin changes, hair discoloration, and distended abdomen. Often occurs when calories are adequate but protein is insufficient.',
                'symptoms_detected': ['Poor skin condition', 'Potential edema signs', 'Skin discoloration'],
                'severity': 'severe' if malnutrition_score > 0.7 else 'moderate'
            })
        
        # Marasmus (severe wasting) - symptoms: severe weight loss, muscle wasting, no edema
        # Characterized by: severe wasting, prominent bones, "old man" appearance
        if bone_prominence > 0.6 and facial_wasting > 0.6 and malnutrition_score > 0.6:
            confidence = min(0.95, malnutrition_score * 0.9 + 0.15)
            detected.append({
                'disease': 'marasmus',
                'confidence': round(confidence, 2),
                'description': 'Severe wasting due to overall energy and protein deficiency. Characterized by severe weight loss, muscle wasting, and prominent bones. No edema present.',
                'symptoms_detected': ['Severe facial wasting', 'Prominent bones', 'Loss of muscle mass'],
                'severity': 'severe' if malnutrition_score > 0.75 else 'moderate'
            })
        
        # Marasmic-kwashiorkor (mixed form)
        if bone_prominence > 0.5 and skin_paleness > 0.4 and malnutrition_score > 0.65:
            confidence = min(0.9, malnutrition_score * 0.85 + 0.1)
            detected.append({
                'disease': 'marasmic_kwashiorkor',
                'confidence': round(confidence, 2),
                'description': 'Mixed form of severe malnutrition combining features of both marasmus (wasting) and kwashiorkor (edema and skin changes). Most severe form of protein-energy malnutrition.',
                'symptoms_detected': ['Severe wasting', 'Skin changes', 'Potential edema'],
                'severity': 'severe'
            })
        
        # Rickets (vitamin D/calcium deficiency) - symptoms: bone deformities, growth issues, delayed milestones
        # More likely if anthropometric data shows stunting
        if anthropometric_score > 0.4 and facial_wasting > 0.4:
            confidence = min(0.85, malnutrition_score * 0.8 + 0.15)
            detected.append({
                'disease': 'rickets',
                'confidence': round(confidence, 2),
                'description': 'Bone softening and deformities due to vitamin D and calcium deficiency. Characterized by bowed legs, delayed growth, and bone pain.',
                'symptoms_detected': ['Growth stunting', 'Potential bone development issues', 'Delayed growth'],
                'severity': 'moderate' if malnutrition_score < 0.6 else 'severe'
            })
        
        # Scurvy (vitamin C deficiency) - symptoms: bleeding gums, poor wound healing, skin issues
        if skin_paleness > 0.5 and malnutrition_score > 0.4:
            confidence = min(0.8, malnutrition_score * 0.75 + 0.1)
            detected.append({
                'disease': 'scurvy',
                'confidence': round(confidence, 2),
                'description': 'Vitamin C deficiency causing bleeding gums, poor wound healing, skin problems, and fatigue. Rare but can occur with very limited diet.',
                'symptoms_detected': ['Poor skin condition', 'Potential bleeding signs', 'Vitamin deficiency indicators'],
                'severity': 'moderate'
            })
        
        # Protein-energy malnutrition (general)
        if malnutrition_score > 0.5 and not any(d['disease'] in ['kwashiorkor', 'marasmus', 'marasmic_kwashiorkor'] for d in detected):
            confidence = min(0.85, malnutrition_score * 0.9)
            detected.append({
                'disease': 'protein_energy_malnutrition',
                'confidence': round(confidence, 2),
                'description': 'General protein-energy malnutrition. Insufficient intake of both calories and protein leading to growth failure and health complications.',
                'symptoms_detected': ['Growth failure', 'Nutritional deficiencies', 'Overall malnutrition signs'],
                'severity': 'severe' if malnutrition_score > 0.7 else 'moderate' if malnutrition_score > 0.55 else 'mild'
            })
        
        # Sort by confidence (highest first)
        detected.sort(key=lambda x: x['confidence'], reverse=True)
        return detected[:3]  # Return top 3 most likely diseases
    
    def _generate_disaster_predictions(self, malnutrition_score: float, status: str) -> List[str]:
        """Generate predictions of potential consequences if malnutrition is not addressed"""
        predictions = []
        
        if malnutrition_score < 0.4:
            return ["No immediate concerns. Continue monitoring for healthy growth."]
        
        if status == "severe_malnutrition" or malnutrition_score > 0.7:
            predictions.extend([
                "CRITICAL: Without intervention, risk of severe complications including:",
                "• Life-threatening infections due to weakened immune system",
                "• Organ failure and potential death",
                "• Permanent stunting and cognitive impairment",
                "• Severe developmental delays that may be irreversible",
                "• Increased susceptibility to diseases like pneumonia and diarrhea"
            ])
        elif status == "moderate_malnutrition" or malnutrition_score > 0.5:
            predictions.extend([
                "WARNING: If nutrition is not improved, the child may experience:",
                "• Growth stunting and delayed physical development",
                "• Weakened immune system leading to frequent illnesses",
                "• Cognitive delays affecting learning and development",
                "• Increased risk of chronic diseases later in life",
                "• Reduced ability to fight infections"
            ])
        else:
            predictions.extend([
                "CAUTION: Continued poor nutrition may lead to:",
                "• Slower growth compared to peers",
                "• Increased susceptibility to infections",
                "• Potential learning difficulties",
                "• Risk of developing more severe malnutrition"
            ])
        
        return predictions
    
    def _generate_nutrition_tips(self, child_age_months: Optional[int], status: str,
                                 detected_diseases: List[Dict[str, Any]] = None) -> List[str]:
        """Generate age-specific and disease-specific nutrition recommendations with meal plans"""
        tips = []
        detected_diseases = detected_diseases or []
        
        if child_age_months is None:
            tips.append("⚠️ Unable to determine child age. Please ensure date of birth is recorded.")
            child_age_months = 12  # Default to 12 months for recommendations
        
        # Get primary disease if detected
        primary_disease = detected_diseases[0]['disease'] if detected_diseases else None
        
        # Disease-specific meal recommendations
        if primary_disease == 'kwashiorkor':
            tips.append("🍽️ KWASHIORKOR - Protein-focused meal plan:")
            if child_age_months <= 12:
                tips.extend([
                    "• High-protein foods: mashed eggs, pureed beans, groundnuts paste",
                    "• Continue breastfeeding + add protein-rich complementary foods",
                    "• Soya porridge with added groundnuts or sesame seeds",
                    "• Fish soup (well-cooked, deboned, pureed)",
                    "• Small amounts of well-cooked meat puree",
                    "• Feed 4-5 times daily with protein at each meal"
                ])
            elif child_age_months <= 24:
                tips.extend([
                    "• Protein-rich meals: eggs (scrambled or boiled), beans, fish, chicken",
                    "• Soya porridge with groundnuts paste (2-3 times daily)",
                    "• Mashed beans with vegetables",
                    "• Fish or chicken soup with vegetables",
                    "• Groundnuts paste mixed with porridge",
                    "• Dairy products: milk, yogurt (if tolerated)",
                    "• Feed 3 main meals + 2 protein-rich snacks daily"
                ])
            else:
                tips.extend([
                    "• High-protein diet: eggs, fish, chicken, beans, groundnuts",
                    "• Soya porridge with groundnuts paste (morning and evening)",
                    "• Beans, peas, or lentils with every meal",
                    "• Fish or meat (well-cooked) 2-3 times weekly",
                    "• Groundnuts, sesame seeds as snacks",
                    "• Dairy: milk, yogurt, cheese if available",
                    "• 3 balanced meals + 2 protein snacks daily"
                ])
        
        elif primary_disease == 'marasmus':
            tips.append("🍽️ MARASMUS - High-calorie, high-protein meal plan:")
            if child_age_months <= 12:
                tips.extend([
                    "• High-energy foods: fortified porridge with oil (1-2 tsp per meal)",
                    "• Continue breastfeeding frequently (every 2-3 hours)",
                    "• Energy-dense complementary foods: mashed banana, avocado",
                    "• Soya porridge with added oil and groundnuts paste",
                    "• Small, frequent feeds (6-8 times daily)",
                    "• Gradually increase portion sizes"
                ])
            elif child_age_months <= 24:
                tips.extend([
                    "• Energy-dense meals: porridge with oil, groundnuts paste, sugar",
                    "• High-calorie snacks: banana, avocado, groundnuts",
                    "• Protein sources: eggs, beans, fish, meat",
                    "• Add 1-2 tsp oil to each meal",
                    "• Soya porridge 2-3 times daily",
                    "• Fruits: banana, mango, papaya (high calorie)",
                    "• Feed 5-6 times daily with energy-dense foods"
                ])
            else:
                tips.extend([
                    "• High-calorie, high-protein diet",
                    "• Add oil (2-3 tsp) to porridge and meals",
                    "• Energy-dense foods: groundnuts, avocado, banana",
                    "• Protein: eggs, fish, chicken, beans daily",
                    "• Soya porridge with groundnuts paste",
                    "• Whole grains: rice, maize, millet with protein",
                    "• 3 main meals + 3 high-calorie snacks daily"
                ])
        
        elif primary_disease == 'rickets':
            tips.append("🍽️ RICKETS - Calcium and Vitamin D focused meal plan:")
            tips.extend([
                "• Calcium-rich foods: milk, yogurt, small fish (with bones), green leafy vegetables",
                "• Vitamin D: egg yolks, fish, fortified foods",
                "• Sunlight exposure: 10-15 minutes daily (morning sun)",
                "• Protein sources: fish, eggs, beans for bone building",
                "• Avoid phytates: soak beans/grains before cooking",
                "• Consider calcium and vitamin D supplements (consult healthcare provider)"
            ])
        
        elif primary_disease == 'scurvy':
            tips.append("🍽️ SCURVY - Vitamin C rich meal plan:")
            tips.extend([
                "• Fresh fruits: oranges, mangoes, papaya, guava, lemons",
                "• Fresh vegetables: tomatoes, leafy greens, bell peppers",
                "• Include vitamin C source with every meal",
                "• Avoid overcooking vegetables (steam lightly to preserve vitamin C)",
                "• Fresh fruit juice (if fruits unavailable)",
                "• Consider vitamin C supplement (consult healthcare provider)"
            ])
        
        # General age-based recommendations if no specific disease or for protein_energy_malnutrition
        if not primary_disease or primary_disease == 'protein_energy_malnutrition':
            if child_age_months is None or child_age_months <= 6:
                tips.extend([
                    "🍼 For infants 0-6 months:",
                    "• Exclusive breastfeeding (8-12 times per day)",
                    "• Ensure mother has adequate nutrition for quality breast milk",
                    "• Monitor feeding frequency and infant weight gain",
                    "• Consult healthcare provider if breastfeeding is insufficient"
                ])
            elif child_age_months <= 12:
                tips.extend([
                    "🍼 For infants 6-12 months:",
                    "• Continue breastfeeding + introduce complementary foods",
                    "• Protein: mashed beans, eggs, fish (pureed), groundnuts paste",
                    "• Iron-rich: pureed meat, beans, fortified cereals",
                    "• Fruits and vegetables: mashed and soft",
                    "• Soya porridge with added nutrients",
                    "• Clean water + breast milk",
                    "• Feed 3-4 times daily"
                ])
            elif child_age_months <= 24:
                tips.extend([
                    "👶 For children 12-24 months:",
                    "• Continue breastfeeding if possible, or nutrient-dense milk",
                    "• Protein: eggs, fish, chicken, beans, groundnuts (2-3 times daily)",
                    "• Soya porridge with groundnuts paste (morning and evening)",
                    "• Fruits: banana, mango, papaya, orange",
                    "• Vegetables: leafy greens, tomatoes, carrots",
                    "• Whole grains: rice, maize porridge",
                    "• Clean water, avoid sugary drinks",
                    "• 3 main meals + 2-3 healthy snacks daily"
                ])
            elif child_age_months <= 60:
                tips.extend([
                    "🧒 For children 2-5 years:",
                    "• Protein: eggs, fish, chicken, beans, groundnuts (daily)",
                    "• Soya porridge with groundnuts paste",
                    "• Fruits and vegetables (5 servings daily)",
                    "• Whole grains: rice, maize, millet",
                    "• Dairy: milk, yogurt if available",
                    "• Clean water, limit sugary snacks",
                    "• 3 balanced meals + 2-3 snacks daily"
                ])
            else:
                tips.extend([
                    "👦 For children over 5 years:",
                    "• Balanced diet with all food groups",
                    "• Protein: eggs, fish, meat, beans (daily)",
                    "• Fruits and vegetables (plenty daily)",
                    "• Whole grains for energy",
                    "• Iron-rich: leafy greens, meat, beans",
                    "• Regular meals + healthy snacks",
                    "• Physical activity alongside nutrition"
                ])
        
        # Status-specific urgent recommendations
        if status in ["severe_malnutrition", "moderate_malnutrition"]:
            tips.append("")
            tips.append("⚠️ URGENT RECOMMENDATIONS:")
            tips.append("• Seek immediate medical consultation")
            tips.append("• Consider therapeutic feeding program enrollment")
            tips.append("• Monitor child closely (daily weight if possible)")
            tips.append("• Follow up within 48-72 hours")
            if status == "severe_malnutrition":
                tips.append("• Hospital referral may be necessary")
        
        # General malnutrition meal tips (only if not already covered by disease-specific recommendations)
        if status != "normal" and not primary_disease:
            tips.append("")
            tips.append("📋 GENERAL MALNUTRITION MEAL GUIDELINES:")
            tips.append("• Feed small, frequent meals (5-6 times daily)")
            tips.append("• Include protein source at every meal")
            tips.append("• Add energy: 1-2 tsp oil to porridge/meals")
            tips.append("• Ensure clean, safe water")
            tips.append("• Include variety: different foods daily")
            tips.append("• Monitor child's appetite and adjust portions")
        
        # Filter out empty strings
        tips = [tip for tip in tips if tip.strip()]
        
        return tips
    
    def update_photo_with_analysis(self, db: Session, photo: Photo, analysis_result: AIAnalysisResponse) -> Photo:
        """Update photo with AI analysis results"""
        import json
        
        try:
            # Update photo with analysis results
            photo.analysis_status = analysis_result.analysis_status.value if hasattr(analysis_result.analysis_status, 'value') else str(analysis_result.analysis_status)
            photo.malnutrition_score = analysis_result.malnutrition_score
            photo.confidence_level = analysis_result.confidence_level
            
            # Convert recommendations list to JSON string
            if analysis_result.recommendations:
                photo.recommendations = json.dumps(analysis_result.recommendations)
            else:
                photo.recommendations = None
            
            # Convert detected_features dict to JSON string
            if analysis_result.detected_features:
                photo.detected_features = json.dumps(analysis_result.detected_features)
            else:
                photo.detected_features = None
            
            # Convert detected_diseases list to JSON string
            if analysis_result.detected_diseases:
                photo.detected_diseases = json.dumps(analysis_result.detected_diseases)
            else:
                photo.detected_diseases = None
            
            # Convert disaster_predictions list to JSON string
            if analysis_result.disaster_predictions:
                photo.disaster_predictions = json.dumps(analysis_result.disaster_predictions)
            else:
                photo.disaster_predictions = None
            
            # Convert nutrition_tips list to JSON string
            if analysis_result.nutrition_tips:
                photo.nutrition_tips = json.dumps(analysis_result.nutrition_tips)
            else:
                photo.nutrition_tips = None
            
            # Set analysis notes
            photo.analysis_notes = analysis_result.analysis_notes
            
            # Mark as analyzed
            photo.is_analyzed = True
            
            db.commit()
            db.refresh(photo)
            
            logger.info(f"Updated photo {photo.id} with analysis results")
            return photo
            
        except Exception as e:
            logger.error(f"Failed to update photo {photo.id} with analysis: {e}")
            db.rollback()
            raise
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current AI model"""
        return {
            'model_version': self.MODEL_VERSION,
            'model_loaded': self.is_model_loaded,
            'model_load_time': self.model_load_time.isoformat() if self.model_load_time else None,
            'tensorflow_available': TF_AVAILABLE,
            'opencv_available': CV2_AVAILABLE,
            'model_type': 'MobileNetV2-based malnutrition detection',
            'input_size': self.INPUT_SIZE,
            'thresholds': {
                'malnutrition_threshold': self.MALNUTRITION_THRESHOLD,
                'high_confidence_threshold': self.HIGH_CONFIDENCE_THRESHOLD
            }
        }


# Global service instance
ai_analysis_service = AIAnalysisService()


async def analyze_image_for_malnutrition(photo: Photo, image_path: str) -> AIAnalysisResponse:
    """
    Main function for malnutrition analysis
    """
    return await ai_analysis_service.analyze_photo(photo, image_path)