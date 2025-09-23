"""
AI Model Training Service for Malnutrition Detection
"""

import os
import json
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
import logging

# Conditional imports for ML libraries
try:
    import tensorflow as tf
    from tensorflow.keras.applications import MobileNetV2
    from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
    from tensorflow.keras.models import Model
    from tensorflow.keras.optimizers import Adam
    from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
    from tensorflow.keras.preprocessing.image import ImageDataGenerator
    from tensorflow.keras.utils import to_categorical
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False

from app.core.logging import get_logger
from app.core.exceptions import AIServiceError, ConfigurationError

logger = get_logger("training_service")

class TrainingService:
    """Service for training malnutrition detection models"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or self._get_default_config()
        self.model = None
        self.training_history = None
        
        # Validate dependencies
        if not TENSORFLOW_AVAILABLE:
            raise ConfigurationError(
                "TensorFlow is required for model training",
                error_code="TENSORFLOW_NOT_AVAILABLE"
            )
        
        if not OPENCV_AVAILABLE:
            logger.warning("OpenCV not available, some image preprocessing features may be limited")
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default training configuration"""
        return {
            "model": {
                "input_shape": (224, 224, 3),
                "num_classes": 3,  # Normal, Moderate, Severe malnutrition
                "base_model": "mobilenetv2",
                "dropout_rate": 0.2,
                "learning_rate": 0.001
            },
            "training": {
                "batch_size": 32,
                "epochs": 100,
                "validation_split": 0.2,
                "patience": 10,
                "min_delta": 0.001
            },
            "data_augmentation": {
                "rotation_range": 20,
                "width_shift_range": 0.2,
                "height_shift_range": 0.2,
                "horizontal_flip": True,
                "zoom_range": 0.2,
                "brightness_range": [0.8, 1.2]
            },
            "paths": {
                "data_dir": "data/training",
                "model_dir": "ml_models",
                "logs_dir": "logs/training"
            }
        }
    
    def create_model(self) -> Model:
        """Create the malnutrition detection model"""
        try:
            logger.info("Creating malnutrition detection model")
            
            # Load pre-trained MobileNetV2
            base_model = MobileNetV2(
                input_shape=self.config["model"]["input_shape"],
                include_top=False,
                weights='imagenet'
            )
            
            # Freeze base model layers
            base_model.trainable = False
            
            # Add custom classification head
            x = base_model.output
            x = GlobalAveragePooling2D()(x)
            x = Dense(512, activation='relu')(x)
            x = Dropout(self.config["model"]["dropout_rate"])(x)
            x = Dense(256, activation='relu')(x)
            x = Dropout(self.config["model"]["dropout_rate"])(x)
            predictions = Dense(
                self.config["model"]["num_classes"], 
                activation='softmax'
            )(x)
            
            # Create the model
            model = Model(inputs=base_model.input, outputs=predictions)
            
            # Compile the model
            model.compile(
                optimizer=Adam(learning_rate=self.config["model"]["learning_rate"]),
                loss='categorical_crossentropy',
                metrics=['accuracy', 'precision', 'recall']
            )
            
            logger.info(f"Model created successfully: {model.count_params()} parameters")
            return model
            
        except Exception as e:
            logger.error(f"Failed to create model: {str(e)}")
            raise AIServiceError(
                f"Model creation failed: {str(e)}",
                error_code="MODEL_CREATION_ERROR"
            )
    
    def prepare_data(self, data_dir: str) -> Tuple[ImageDataGenerator, ImageDataGenerator]:
        """Prepare training and validation data generators"""
        try:
            logger.info(f"Preparing data from {data_dir}")
            
            # Create data generators
            train_datagen = ImageDataGenerator(
                rescale=1./255,
                rotation_range=self.config["data_augmentation"]["rotation_range"],
                width_shift_range=self.config["data_augmentation"]["width_shift_range"],
                height_shift_range=self.config["data_augmentation"]["height_shift_range"],
                horizontal_flip=self.config["data_augmentation"]["horizontal_flip"],
                zoom_range=self.config["data_augmentation"]["zoom_range"],
                brightness_range=self.config["data_augmentation"]["brightness_range"],
                validation_split=self.config["training"]["validation_split"]
            )
            
            val_datagen = ImageDataGenerator(
                rescale=1./255,
                validation_split=self.config["training"]["validation_split"]
            )
            
            # Create training generator
            train_generator = train_datagen.flow_from_directory(
                data_dir,
                target_size=self.config["model"]["input_shape"][:2],
                batch_size=self.config["training"]["batch_size"],
                class_mode='categorical',
                subset='training',
                shuffle=True
            )
            
            # Create validation generator
            val_generator = val_datagen.flow_from_directory(
                data_dir,
                target_size=self.config["model"]["input_shape"][:2],
                batch_size=self.config["training"]["batch_size"],
                class_mode='categorical',
                subset='validation',
                shuffle=False
            )
            
            logger.info(f"Data prepared: {train_generator.samples} training samples, {val_generator.samples} validation samples")
            return train_generator, val_generator
            
        except Exception as e:
            logger.error(f"Failed to prepare data: {str(e)}")
            raise AIServiceError(
                f"Data preparation failed: {str(e)}",
                error_code="DATA_PREPARATION_ERROR"
            )
    
    def train_model(self, data_dir: str, model_name: str = None) -> Dict[str, Any]:
        """Train the malnutrition detection model"""
        try:
            logger.info("Starting model training")
            
            # Create model
            self.model = self.create_model()
            
            # Prepare data
            train_generator, val_generator = self.prepare_data(data_dir)
            
            # Create callbacks
            callbacks = self._create_callbacks(model_name)
            
            # Train the model
            logger.info("Training model...")
            self.training_history = self.model.fit(
                train_generator,
                epochs=self.config["training"]["epochs"],
                validation_data=val_generator,
                callbacks=callbacks,
                verbose=1
            )
            
            # Save the model
            model_path = self._save_model(model_name)
            
            # Save training metadata
            metadata = self._save_training_metadata(model_path, train_generator, val_generator)
            
            logger.info(f"Model training completed successfully. Saved to: {model_path}")
            
            return {
                "model_path": model_path,
                "metadata": metadata,
                "training_history": self.training_history.history
            }
            
        except Exception as e:
            logger.error(f"Model training failed: {str(e)}")
            raise AIServiceError(
                f"Model training failed: {str(e)}",
                error_code="TRAINING_ERROR"
            )
    
    def _create_callbacks(self, model_name: str = None) -> List:
        """Create training callbacks"""
        callbacks = []
        
        # Early stopping
        early_stopping = EarlyStopping(
            monitor='val_loss',
            patience=self.config["training"]["patience"],
            min_delta=self.config["training"]["min_delta"],
            restore_best_weights=True,
            verbose=1
        )
        callbacks.append(early_stopping)
        
        # Learning rate reduction
        lr_reduction = ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1
        )
        callbacks.append(lr_reduction)
        
        # Model checkpoint
        if model_name:
            checkpoint_path = os.path.join(
                self.config["paths"]["model_dir"], 
                f"{model_name}_checkpoint.h5"
            )
            model_checkpoint = ModelCheckpoint(
                checkpoint_path,
                monitor='val_loss',
                save_best_only=True,
                save_weights_only=False,
                verbose=1
            )
            callbacks.append(model_checkpoint)
        
        return callbacks
    
    def _save_model(self, model_name: str = None) -> str:
        """Save the trained model"""
        if not model_name:
            model_name = f"malnutrition_detection_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Create model directory
        model_dir = Path(self.config["paths"]["model_dir"])
        model_dir.mkdir(parents=True, exist_ok=True)
        
        # Save model
        model_path = model_dir / f"{model_name}.h5"
        self.model.save(str(model_path))
        
        return str(model_path)
    
    def _save_training_metadata(
        self, 
        model_path: str, 
        train_generator, 
        val_generator
    ) -> Dict[str, Any]:
        """Save training metadata"""
        metadata = {
            "model_path": model_path,
            "config": self.config,
            "training_info": {
                "train_samples": train_generator.samples,
                "val_samples": val_generator.samples,
                "num_classes": train_generator.num_classes,
                "class_indices": train_generator.class_indices,
                "batch_size": self.config["training"]["batch_size"],
                "epochs_trained": len(self.training_history.history['loss']),
                "final_train_loss": self.training_history.history['loss'][-1],
                "final_val_loss": self.training_history.history['val_loss'][-1],
                "final_train_accuracy": self.training_history.history['accuracy'][-1],
                "final_val_accuracy": self.training_history.history['val_accuracy'][-1]
            },
            "timestamp": datetime.now().isoformat()
        }
        
        # Save metadata
        metadata_path = model_path.replace('.h5', '_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        return metadata
    
    def evaluate_model(self, test_data_dir: str) -> Dict[str, float]:
        """Evaluate the trained model on test data"""
        try:
            if not self.model:
                raise AIServiceError("No model loaded for evaluation")
            
            logger.info("Evaluating model on test data")
            
            # Create test data generator
            test_datagen = ImageDataGenerator(rescale=1./255)
            test_generator = test_datagen.flow_from_directory(
                test_data_dir,
                target_size=self.config["model"]["input_shape"][:2],
                batch_size=self.config["training"]["batch_size"],
                class_mode='categorical',
                shuffle=False
            )
            
            # Evaluate model
            evaluation = self.model.evaluate(test_generator, verbose=1)
            
            # Get predictions for detailed metrics
            predictions = self.model.predict(test_generator)
            predicted_classes = np.argmax(predictions, axis=1)
            true_classes = test_generator.classes
            
            # Calculate additional metrics
            from sklearn.metrics import classification_report, confusion_matrix
            
            report = classification_report(
                true_classes, 
                predicted_classes, 
                target_names=list(test_generator.class_indices.keys()),
                output_dict=True
            )
            
            confusion_mat = confusion_matrix(true_classes, predicted_classes)
            
            results = {
                "test_loss": evaluation[0],
                "test_accuracy": evaluation[1],
                "test_precision": evaluation[2],
                "test_recall": evaluation[3],
                "classification_report": report,
                "confusion_matrix": confusion_mat.tolist()
            }
            
            logger.info(f"Model evaluation completed: {results['test_accuracy']:.4f} accuracy")
            return results
            
        except Exception as e:
            logger.error(f"Model evaluation failed: {str(e)}")
            raise AIServiceError(
                f"Model evaluation failed: {str(e)}",
                error_code="EVALUATION_ERROR"
            )
    
    def load_model(self, model_path: str) -> Model:
        """Load a trained model"""
        try:
            logger.info(f"Loading model from {model_path}")
            self.model = tf.keras.models.load_model(model_path)
            logger.info("Model loaded successfully")
            return self.model
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise AIServiceError(
                f"Model loading failed: {str(e)}",
                error_code="MODEL_LOADING_ERROR"
            )
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current model"""
        if not self.model:
            return {"error": "No model loaded"}
        
        return {
            "model_summary": self.model.summary(),
            "input_shape": self.model.input_shape,
            "output_shape": self.model.output_shape,
            "num_parameters": self.model.count_params(),
            "config": self.config
        }
