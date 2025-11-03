#!/usr/bin/env python3
"""
Create a Baseline Model for Production
Since we don't have image dataset yet, this creates a working baseline model
that can be replaced later with trained data.
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.logging import get_logger

logger = get_logger("baseline_model")

def create_baseline_model():
    """Create a baseline MobileNetV2 model structure"""
    try:
        import tensorflow as tf
        from tensorflow.keras.applications import MobileNetV2
        from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
        from tensorflow.keras.models import Model
        
        logger.info("Creating baseline model...")
        
        # Create model structure (same as training)
        base_model = MobileNetV2(
            input_shape=(224, 224, 3),
            include_top=False,
            weights='imagenet'
        )
        
        # Freeze base model initially
        base_model.trainable = False
        
        # Add custom head
        x = base_model.output
        x = GlobalAveragePooling2D()(x)
        x = Dense(512, activation='relu')(x)
        x = Dropout(0.2)(x)
        x = Dense(256, activation='relu')(x)
        x = Dropout(0.2)(x)
        predictions = Dense(3, activation='softmax', name='malnutrition_class')(x)
        
        model = Model(inputs=base_model.input, outputs=predictions)
        
        # Compile with same settings as training
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        # Create model directory
        model_dir = Path(__file__).parent.parent / "ml_models"
        model_dir.mkdir(exist_ok=True)
        
        model_name = "malnutrition_baseline"
        model_path = model_dir / f"{model_name}.h5"
        
        # Save model
        model.save(str(model_path))
        logger.info(f"Model saved to {model_path}")
        
        # Create metadata
        metadata = {
            "model_name": model_name,
            "version": "1.0.0",
            "created_at": datetime.now().isoformat(),
            "architecture": "MobileNetV2",
            "input_shape": [224, 224, 3],
            "num_classes": 3,
            "classes": ["normal", "moderate_malnutrition", "severe_malnutrition"],
            "training_status": "baseline",
            "note": "Baseline model created for development. Retrain with real data for production.",
            "accuracy": 0.0,
            "validation_accuracy": 0.0,
            "training_samples": 0,
            "validation_samples": 0
        }
        
        metadata_path = model_dir / f"{model_name}_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Metadata saved to {metadata_path}")
        
        # Create evaluation file
        evaluation = {
            "accuracy": 0.0,
            "precision": {"normal": 0.0, "moderate_malnutrition": 0.0, "severe_malnutrition": 0.0},
            "recall": {"normal": 0.0, "moderate_malnutrition": 0.0, "severe_malnutrition": 0.0},
            "f1_score": {"normal": 0.0, "moderate_malnutrition": 0.0, "severe_malnutrition": 0.0},
            "note": "Baseline model - not trained on real data"
        }
        
        eval_path = model_dir / f"{model_name}_evaluation.json"
        with open(eval_path, 'w') as f:
            json.dump(evaluation, f, indent=2)
        
        logger.info(f"Evaluation file saved to {eval_path}")
        
        logger.info("=" * 60)
        logger.info("Baseline model created successfully!")
        logger.info(f"Model: {model_path}")
        logger.info("Note: This is a baseline model. Train with real image data for production.")
        logger.info("=" * 60)
        
        return True
        
    except ImportError:
        logger.error("TensorFlow not available. Install with: pip install tensorflow")
        return False
    except Exception as e:
        logger.error(f"Failed to create baseline model: {e}", exc_info=True)
        return False

if __name__ == "__main__":
    success = create_baseline_model()
    sys.exit(0 if success else 1)

